// Speech-to-text utility using Web Speech API
export class SpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isInterim?: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Try multiple ways to access SpeechRecognition API
      // iOS Safari uses webkitSpeechRecognition (available in iOS 14.5+)
      // Chrome/Edge use SpeechRecognition
      // Check in order: webkit (for iOS), then standard (for Chrome/Edge)
      const SpeechRecognition = 
        (window as any).webkitSpeechRecognition ||  // iOS Safari uses webkit prefix
        (window as any).SpeechRecognition;          // Chrome/Edge use standard name
      
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          
          // iOS Safari requires continuous mode to work properly
          // Detect iOS
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          
          // Android detection
          const isAndroid = /Android/.test(navigator.userAgent);
          
          // For mobile devices, use continuous mode and adjust settings
          if (isIOS || isAndroid) {
            this.recognition.continuous = true; // iOS needs continuous mode
            this.recognition.interimResults = true;
          } else {
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
          }
          
          this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Call callback with interim results for real-time display
          if (interimTranscript && this.onResultCallback) {
            this.onResultCallback(interimTranscript, true);
          }

          // Call callback with final transcript when ready
          if (finalTranscript && this.onResultCallback) {
            this.onResultCallback(finalTranscript.trim(), false);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
          // On iOS, recognition may end automatically, so we don't want to stop listening
          // unless there was an error or user explicitly stopped
        };
        
        // iOS-specific: Handle speech start event
        this.recognition.onstart = () => {
          console.log('Speech recognition started');
        };
        
        // iOS-specific: Handle audio start event
        this.recognition.onaudiostart = () => {
          console.log('Audio capture started');
        };
        
        // iOS-specific: Handle audio end event
        this.recognition.onaudioend = () => {
          console.log('Audio capture ended');
        };
        
        // iOS-specific: Handle sound start event
        this.recognition.onsoundstart = () => {
          console.log('Sound detected');
        };
        
        // iOS-specific: Handle sound end event
        this.recognition.onsoundend = () => {
          console.log('Sound ended');
        };
        
        // iOS-specific: Handle speech end event
        this.recognition.onspeechend = () => {
          console.log('Speech ended');
        };
        
        // iOS-specific: Handle nomatch event (no speech detected)
        this.recognition.onnomatch = () => {
          console.log('No speech match found');
          if (this.onErrorCallback) {
            this.onErrorCallback('No speech detected. Please try again.');
          }
        };
        } catch (error: any) {
          console.error('Error initializing SpeechRecognition:', error);
          this.recognition = null;
        }
      }
    }
  }

  start(onResult: (text: string, isInterim?: boolean) => void, onError?: (error: string) => void): void {
    if (!this.recognition) {
      const error = 'Speech recognition not supported in this browser';
      console.warn(error);
      if (onError) onError(error);
      return;
    }

    if (this.isListening) {
      this.stop();
      // Wait a bit before restarting (iOS needs this)
      setTimeout(() => {
        this.attemptStart(onResult, onError);
      }, 100);
      return;
    }

    this.attemptStart(onResult, onError);
  }

  private attemptStart(onResult: (text: string, isInterim?: boolean) => void, onError?: (error: string) => void): void {
    if (!this.recognition) return;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.isListening = true;

    try {
      // For iOS, we need to ensure we're in a user interaction context
      this.recognition.start();
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      this.isListening = false;
      
      // Handle specific iOS errors
      if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
        // Recognition might already be running, try to stop and restart
        try {
          this.recognition.stop();
        } catch (stopError) {
          // Ignore stop errors
        }
        // Retry after a short delay
        setTimeout(() => {
          try {
            this.recognition.start();
            this.isListening = true;
          } catch (retryError: any) {
            this.isListening = false;
            if (onError) {
              onError('Please tap the microphone button to start voice input');
            }
          }
        }, 300);
      } else {
        if (onError) {
          onError(error.message || 'Failed to start speech recognition. Please try again.');
        }
      }
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      this.isListening = false;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }
}

