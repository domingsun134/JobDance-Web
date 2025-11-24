// Speech-to-text utility using Web Speech API
export class SpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isInterim?: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
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
        };
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
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      this.isListening = false;
      if (onError) {
        onError(error.message || 'Failed to start speech recognition');
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

