// Text-to-speech utility using AWS Polly with fallback to browser TTS
export class SpeechSynthesis {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private synth: any = null; // Browser SpeechSynthesis API
  private isSpeaking: boolean = false;
  private useBrowserTTS: boolean = false;
  private audioUnlocked: boolean = false;
  private isIOSDevice: boolean = false;
  private pendingOnEnd: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass =
        (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
      this.isIOSDevice =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if ('speechSynthesis' in window) {
        this.synth = (window as any).speechSynthesis;
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
        const audioArrayBuffer = await response.arrayBuffer();
        this.setPendingOnEnd(onEnd);

        if (this.audioContext && (!this.isIOSDevice || this.audioUnlocked)) {
          try {
            await this.playWithWebAudio(audioArrayBuffer.slice(0), onEnd);
            return;
          } catch (webAudioError) {
            console.warn('Web Audio playback failed, falling back to HTML audio:', webAudioError);
          }
        }

        await this.playWithHtmlAudio(audioArrayBuffer, text, onEnd);
        return;
      } else {
        this.clearPendingOnEnd();
        // If API returns error, fallback to browser TTS
        const errorData = await response.json().catch(() => ({}));
        console.warn('AWS Polly failed, using browser TTS:', errorData.error || 'Unknown error');
        this.speakWithBrowserTTS(text, onEnd);
      }
    } catch (error) {
      this.clearPendingOnEnd();
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

    const utterance = new (window as any).SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (error: any) => {
      console.error('Browser TTS error:', error);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop(0);
      } catch (error) {
        console.warn('Error stopping audio source:', error);
      }
    }
    this.cleanupWebAudio();
    if (this.currentAudio) {
      this.cleanupHtmlAudio();
    }
    this.clearPendingOnEnd();
    this.isSpeaking = false;
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  async unlockAudio(): Promise<void> {
    if (this.audioUnlocked || typeof window === 'undefined') {
      return;
    }

    try {
      if (!this.audioContext) {
        const AudioContextClass =
          (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch(() => undefined);
      }

      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      silentAudio.volume = 0;
      silentAudio.preload = 'auto';
      await silentAudio.play();
      silentAudio.pause();
      silentAudio.currentTime = 0;

      if (this.audioContext) {
        try {
          const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
          const source = this.audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(this.audioContext.destination);
          source.start();
          source.stop();
          source.disconnect();
        } catch (error) {
          console.warn('Failed to prime audio context:', error);
        }
      }

      this.audioUnlocked = true;
    } catch (error) {
      console.warn('Failed to unlock audio context:', error);
    }
  }

  private async playWithWebAudio(audioData: ArrayBuffer, onEnd?: () => void): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const decodedBuffer = await this.decodeAudioData(audioData);

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = decodedBuffer;
    gainNode.gain.value = 1.0;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.onended = () => {
      this.cleanupWebAudio();
      this.triggerOnEnd();
    };

    this.currentSource = source;
    this.gainNode = gainNode;
    this.isSpeaking = true;

    try {
      source.start(0);
    } catch (error) {
      this.cleanupWebAudio();
      this.clearPendingOnEnd();
      throw error;
    }
  }

  private async playWithHtmlAudio(audioData: ArrayBuffer, originalText: string, onEnd?: () => void): Promise<void> {
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio();
    audio.src = audioUrl;
    audio.volume = 1.0;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    this.currentAudio = audio;
    this.currentAudioUrl = audioUrl;
    this.isSpeaking = true;

    let handled = false;
    const handleEnded = () => {
      if (handled) return;
      handled = true;
      this.cleanupHtmlAudio(audio);
      this.triggerOnEnd();
    };

    const handleError = (error?: any) => {
      if (handled) return;
      handled = true;
      this.cleanupHtmlAudio(audio);
      console.warn('Audio playback error, falling back to browser TTS:', error);
      this.clearPendingOnEnd();
      this.speakWithBrowserTTS(originalText, onEnd);
    };

    audio.addEventListener('ended', handleEnded, { once: true });
    audio.addEventListener(
      'error',
      (event) => {
        const mediaError = (event as any)?.error || new Error('Audio element error');
        handleError(mediaError);
      },
      { once: true }
    );

    try {
      await audio.play();
    } catch (playError) {
      handleError(playError);
    }
  }

  private cleanupWebAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.disconnect();
      } catch (error) {
        console.warn('Error disconnecting audio source:', error);
      }
      this.currentSource = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (error) {
        console.warn('Error disconnecting gain node:', error);
      }
      this.gainNode = null;
    }
    this.isSpeaking = false;
  }

  private cleanupHtmlAudio(target?: HTMLAudioElement): void {
    const audioElement = target ?? this.currentAudio;
    if (audioElement) {
      try {
        audioElement.pause();
      } catch {
        // Ignore pause errors
      }
      audioElement.currentTime = 0;
      audioElement.removeAttribute('src');
      audioElement.load();
      if (this.currentAudio === audioElement) {
        this.currentAudio = null;
      }
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    this.isSpeaking = false;
  }

  private decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      return Promise.reject(new Error('AudioContext not available'));
    }

    return new Promise((resolve, reject) => {
      this.audioContext!.decodeAudioData(
        audioData,
        (buffer) => resolve(buffer),
        (error) => reject(error)
      );
    });
  }

  private setPendingOnEnd(callback?: () => void): void {
    this.pendingOnEnd = callback || null;
  }

  private clearPendingOnEnd(): void {
    this.pendingOnEnd = null;
  }

  private triggerOnEnd(): void {
    const callback = this.pendingOnEnd;
    this.pendingOnEnd = null;
    if (callback) {
      callback();
    }
  }
}

