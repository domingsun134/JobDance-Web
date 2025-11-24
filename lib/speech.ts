// Text-to-speech utility using AWS Polly with fallback to browser TTS
export class SpeechSynthesis {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private useBrowserTTS: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('AudioContext' in window) {
        this.audioContext = new AudioContext();
      }
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  async speak(text: string, onEnd?: () => void): Promise<void> {
    // Stop any ongoing speech
    this.stop();

    // Resume audio context if suspended (required for autoplay)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }

    // Try AWS Polly first, fallback to browser TTS if it fails
    try {
      // Call AWS Polly API
      const response = await fetch('/api/ai/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId: 'Ruth' }),
      });

      if (response.ok) {
        // Create audio element and play
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Set volume to ensure it's audible
        audio.volume = 1.0;
        audio.preload = 'auto';

        // Set up event handlers
        const cleanup = () => {
          this.isSpeaking = false;
          URL.revokeObjectURL(audioUrl);
        };

        audio.onended = () => {
          cleanup();
          if (onEnd) onEnd();
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          cleanup();
          // Fallback to browser TTS
          this.speakWithBrowserTTS(text, onEnd);
          return;
        };

        // Try to play the audio
        this.currentAudio = audio;
        this.isSpeaking = true;
        
        try {
          // Wait for audio to be ready, then play
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Audio load timeout'));
            }, 5000);

            audio.oncanplaythrough = () => {
              clearTimeout(timeout);
              resolve();
            };

            audio.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Audio load error'));
            };

            // If already can play, resolve immediately
            if (audio.readyState >= 3) {
              clearTimeout(timeout);
              resolve();
            }
          });

          // Now try to play
          try {
            await audio.play();
          } catch (playError: any) {
            console.warn('Audio play() failed (autoplay restriction?), using browser TTS:', playError);
            cleanup();
            this.speakWithBrowserTTS(text, onEnd);
          }
        } catch (loadError: any) {
          console.warn('Audio failed to load, using browser TTS:', loadError);
          cleanup();
          this.speakWithBrowserTTS(text, onEnd);
        }
        return;
      } else {
        // If API returns error, fallback to browser TTS
        const errorData = await response.json().catch(() => ({}));
        console.warn('AWS Polly failed, using browser TTS:', errorData.error || 'Unknown error');
        this.speakWithBrowserTTS(text, onEnd);
      }
    } catch (error) {
      console.warn('Error with AWS Polly, using browser TTS:', error);
      // Fallback to browser TTS
      this.speakWithBrowserTTS(text, onEnd);
    }
  }

  private speakWithBrowserTTS(text: string, onEnd?: () => void): void {
    if (!this.synth) {
      console.error('Browser TTS not supported');
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (error) => {
      console.error('Browser TTS error:', error);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isSpeaking = false;
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}

