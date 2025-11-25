// Speech-to-text utility using Web Speech API
export class SpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isInterim?: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private microphonePermissionGranted: boolean = false;
  private isIOS: boolean = false;
  private accumulatedTranscript: string = '';
  private silenceTimer: NodeJS.Timeout | null = null;
  private SILENCE_TIMEOUT_MS: number = 5000; // 5 seconds (5000ms) of silence before auto-submitting answer - increased to prevent premature submission
  private isAndroid: boolean = false;
  private lastSpeechTime: number = 0; // Track when we last detected speech
  private lastRestartTime: number = 0; // Track when we last restarted recognition to prevent rapid restarts

  constructor() {
    if (typeof window !== 'undefined') {
      // Detect iOS early
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
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
          
          // Android detection
          this.isAndroid = /Android/.test(navigator.userAgent);
          
          // For mobile devices, use continuous mode and adjust settings
          if (this.isIOS || this.isAndroid) {
            this.recognition.continuous = true; // iOS needs continuous mode
            this.recognition.interimResults = true;
            // iOS Safari works better with maxAlternatives set to 1
            if (this.isIOS && this.recognition.maxAlternatives !== undefined) {
              this.recognition.maxAlternatives = 1;
            }
          } else {
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
          }
          
          this.recognition.lang = 'en-US';
          
          // iOS-specific: Set serviceURI if available (for better iOS compatibility)
          if (this.isIOS && (this.recognition as any).serviceURI === undefined) {
            // Some iOS versions may need explicit service configuration
            console.log('iOS detected - using webkitSpeechRecognition with continuous mode');
          }

        this.recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // Process all results from resultIndex to the end
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Reset silence timer whenever we detect any speech (interim or final)
          // This ensures we wait for 5 seconds of complete silence before submitting
          if (interimTranscript || finalTranscript) {
            this.clearSilenceTimer();
            this.lastSpeechTime = Date.now(); // Update last speech time
            
            // Update accumulated transcript with final results
            if (finalTranscript) {
              this.accumulatedTranscript += finalTranscript;
            }
            
            // Show current accumulated + interim results in real-time
            const currentTranscript = (this.accumulatedTranscript + interimTranscript).trim();
            if (currentTranscript && this.onResultCallback) {
              this.onResultCallback(currentTranscript, true);
            }
          }

          // When we get a final result, start the silence timer
          // Only submit after 5 seconds of silence to ensure user is done speaking
          if (finalTranscript) {
            const finalText = this.accumulatedTranscript.trim();
            if (finalText) {
              // Create a reusable callback function for the silence timer
              const silenceTimerCallback = () => {
                // 5 seconds of silence detected - user is done speaking
                // Double-check that we haven't received new speech recently (within last 1 second)
                const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
                if (timeSinceLastSpeech >= this.SILENCE_TIMEOUT_MS - 1000) {
                  // Safe to submit - we've had enough silence
                  if (this.onResultCallback && this.accumulatedTranscript.trim()) {
                    const textToSubmit = this.accumulatedTranscript.trim();
                    this.accumulatedTranscript = ''; // Reset for next input
                    this.onResultCallback(textToSubmit, false);
                    
                    // Stop recognition after submitting
                    if (this.isIOS || this.isAndroid) {
                      setTimeout(() => {
                        if (this.recognition && this.isListening) {
                          try {
                            this.recognition.stop();
                          } catch (e) {
                            // Ignore stop errors
                          }
                        }
                      }, 100);
                    }
                  }
                } else {
                  // New speech detected recently, restart the timer
                  console.log('New speech detected, restarting silence timer');
                  this.startSilenceTimer(silenceTimerCallback);
                }
              };
              
              // Start silence timer - if no new speech for 5 seconds, submit the answer
              this.startSilenceTimer(silenceTimerCallback);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error, event);
          
          // Don't stop on 'no-speech' errors in continuous mode - this is normal
          if (event.error === 'no-speech' && (this.isIOS || this.isAndroid)) {
            // In continuous mode, 'no-speech' is not necessarily an error
            // Just log it but don't stop or call error callback
            console.log('No speech detected (this is normal in continuous mode)');
            return;
          }
          
          // Handle permission errors specifically
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.microphonePermissionGranted = false;
            if (this.onErrorCallback) {
              this.onErrorCallback('Microphone permission denied. Please enable microphone access in Safari settings.');
            }
            this.isListening = false;
            return;
          }
          
          // Handle audio capture errors (common on iOS when microphone isn't accessible)
          if (event.error === 'audio-capture' || event.error === 'no-speech') {
            if (this.isIOS && !this.microphonePermissionGranted) {
              // On iOS, this often means we need to request permission first
              if (this.onErrorCallback) {
                this.onErrorCallback('Microphone access required. Please grant permission when prompted.');
              }
            }
            this.isListening = false;
            return;
          }
          
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          console.log('Speech recognition ended');
          
          // Don't submit immediately on end - let the silence timer handle submission
          // This ensures we always wait the full 5 seconds of silence before submitting
          // The timer will submit when it completes after 5 seconds
          
          // In continuous mode (iOS/Android), recognition might end automatically
          // If we have an active silence timer, we need to restart recognition to keep listening
          // This ensures we capture the full 5 seconds of silence before submitting
          if (this.silenceTimer && this.accumulatedTranscript.trim()) {
            // Recognition ended but we have text and a timer running
            // Restart recognition to keep listening for the remaining silence period
            // Prevent rapid restarts (at least 200ms between restarts)
            const timeSinceLastRestart = Date.now() - this.lastRestartTime;
            if (timeSinceLastRestart < 200) {
              console.log('Skipping restart - too soon since last restart');
              return;
            }
            
            console.log('Recognition ended with active timer - restarting to continue listening for full 5 seconds');
            this.lastRestartTime = Date.now();
            
            // Restart recognition after a short delay to avoid immediate errors
            setTimeout(() => {
              if (this.isListening && this.recognition && this.silenceTimer) {
                try {
                  this.recognition.start();
                  console.log('Recognition restarted to continue listening');
                } catch (error: any) {
                  // If restart fails (e.g., already started), that's okay
                  // The timer will still complete and submit
                  console.log('Recognition restart skipped (may already be running):', error.message);
                }
              }
            }, 100);
          } else if (!this.silenceTimer && !this.accumulatedTranscript.trim()) {
            // No timer and no text - recognition ended normally
            this.isListening = false;
          } else if (this.accumulatedTranscript.trim() && !this.silenceTimer) {
            // Recognition ended, we have text, but no timer - start one now
            // This handles cases where recognition stops unexpectedly
            console.log('Recognition ended with text but no timer - starting silence timer');
            this.startSilenceTimer(() => {
              if (this.onResultCallback && this.accumulatedTranscript.trim()) {
                const textToSubmit = this.accumulatedTranscript.trim();
                this.accumulatedTranscript = '';
                this.onResultCallback(textToSubmit, false);
                this.isListening = false;
              }
            });
          }
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

  /**
   * Request microphone permission explicitly (required for iOS Safari)
   * This is a workaround for iOS Safari which often requires getUserMedia
   * to be called before speech recognition will work
   */
  async requestMicrophonePermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported');
      return false;
    }

    try {
      // Request microphone access with minimal constraints
      // This triggers the permission prompt on iOS Safari
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      this.microphonePermissionGranted = true;
      console.log('Microphone permission granted');
      return true;
    } catch (error: any) {
      console.error('Microphone permission denied or error:', error);
      this.microphonePermissionGranted = false;
      return false;
    }
  }

  /**
   * Check if microphone permission is already granted
   */
  async checkMicrophonePermission(): Promise<boolean> {
    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback: try to request permission
      return await this.requestMicrophonePermission();
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      this.microphonePermissionGranted = result.state === 'granted';
      return this.microphonePermissionGranted;
    } catch (error) {
      // If permission query fails, try requesting directly
      console.warn('Permission query not supported, requesting directly');
      return await this.requestMicrophonePermission();
    }
  }

  async start(onResult: (text: string, isInterim?: boolean) => void, onError?: (error: string) => void): Promise<void> {
    if (!this.recognition) {
      const error = 'Speech recognition not supported in this browser';
      console.warn(error);
      if (onError) onError(error);
      return;
    }

    if (this.isListening) {
      this.stop();
      // Wait a bit before restarting (iOS needs this)
      setTimeout(async () => {
        await this.attemptStart(onResult, onError);
      }, 100);
      return;
    }

    // Reset accumulated transcript when starting new recognition
    this.accumulatedTranscript = '';
    this.clearSilenceTimer();
    this.lastSpeechTime = 0; // Reset last speech time
    this.lastRestartTime = 0; // Reset restart time
    
    await this.attemptStart(onResult, onError);
  }

  private async attemptStart(onResult: (text: string, isInterim?: boolean) => void, onError?: (error: string) => void): Promise<void> {
    if (!this.recognition) return;

    // For iOS Safari, explicitly request microphone permission first
    // This is a critical workaround - iOS Safari often requires getUserMedia
    // to be called before speech recognition will capture audio
    // Only request if we haven't already been granted permission
    if (this.isIOS && !this.microphonePermissionGranted) {
      console.log('iOS detected - requesting microphone permission first...');
      const permissionGranted = await this.requestMicrophonePermission();
      
      if (!permissionGranted) {
        this.isListening = false;
        if (onError) {
          onError('Microphone permission is required. Please allow microphone access when prompted, then try again.');
        }
        return;
      }
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.isListening = true;

    try {
      // For iOS, we need to ensure we're in a user interaction context
      // Start recognition immediately without delay
      this.recognition.start();
      console.log('Speech recognition started successfully');
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
            console.log('Speech recognition restarted after InvalidStateError');
          } catch (retryError: any) {
            this.isListening = false;
            if (onError) {
              onError('Please tap the microphone button to start voice input');
            }
          }
        }, 300);
      } else if (error.name === 'NotAllowedError' || error.message?.includes('not allowed')) {
        this.microphonePermissionGranted = false;
        if (onError) {
          if (this.isIOS) {
            onError('Microphone permission denied. Please go to Settings > Safari > Microphone and enable it, then refresh the page.');
          } else {
            onError('Microphone permission is required for voice input. Please enable it in your browser settings.');
          }
        }
      } else {
        if (onError) {
          onError(error.message || 'Failed to start speech recognition. Please try again.');
        }
      }
    }
  }

  stop(): void {
    // Clear the silence timer to prevent auto-submission when manually stopping
    this.clearSilenceTimer();
    this.accumulatedTranscript = '';
    this.lastSpeechTime = 0;
    this.lastRestartTime = 0;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      this.isListening = false;
    }
  }

  /**
   * Start the silence timer - will trigger callback after 3 seconds of silence
   */
  private startSilenceTimer(callback: () => void): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      callback();
      this.silenceTimer = null;
    }, this.SILENCE_TIMEOUT_MS);
  }

  /**
   * Clear the silence timer (called when new speech is detected)
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Get whether this is running on iOS
   */
  getIsIOS(): boolean {
    return this.isIOS;
  }

  /**
   * Get whether microphone permission has been granted
   */
  isMicrophonePermissionGranted(): boolean {
    return this.microphonePermissionGranted;
  }

  /**
   * Set microphone permission status (useful for syncing with external permission checks)
   */
  setMicrophonePermissionGranted(granted: boolean): void {
    this.microphonePermissionGranted = granted;
  }
}

