// Video recording utility
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private videoElement: HTMLVideoElement | null = null;

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if MediaRecorder is available
    if (!window.MediaRecorder) return false;
    
    // iOS Safari has limited MediaRecorder support
    // It's available in iOS 14.5+ but with limitations
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      // Check if any codec is supported
      return MediaRecorder.isTypeSupported('video/webm') || 
             MediaRecorder.isTypeSupported('video/mp4');
    }
    
    return true;
  }

  async startRecording(
    videoElement: HTMLVideoElement,
    onDataAvailable?: (blob: Blob) => void
  ): Promise<void> {
    try {
      // Request camera and microphone access with mobile-friendly constraints
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      // Mobile devices may have different camera capabilities
      const videoConstraints: MediaTrackConstraints = isIOS || isAndroid ? {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: 'user'
      } : {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      };

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up video element
      this.videoElement = videoElement;
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      // Set up MediaRecorder with mobile-friendly codecs
      // iOS Safari supports limited codecs, Android Chrome supports more
      // Reuse isIOS and isAndroid variables defined above
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: isIOS || isAndroid ? 2000000 : 2500000 // Lower bitrate for mobile
      };

      // Try codecs in order of preference, with mobile-friendly fallbacks
      const codecs = [
        'video/webm;codecs=vp9,opus',  // Best quality
        'video/webm;codecs=vp8,opus',  // Good quality, better mobile support
        'video/webm',                   // Basic webm
        'video/mp4',                    // iOS fallback (though MediaRecorder may not support it)
      ];

      // For iOS, we need to be more careful with codec selection
      if (isIOS) {
        // iOS Safari has limited MediaRecorder support
        // Try webm first, but it may not work on all iOS versions
        options.mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }
      } else {
        // For Android and desktop, try codecs in order
        for (const codec of codecs) {
          if (MediaRecorder.isTypeSupported(codec)) {
            options.mimeType = codec;
            break;
          }
        }
      }

      // Final fallback
      if (!options.mimeType) {
        options.mimeType = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
          if (onDataAvailable) {
            onDataAvailable(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Error starting video recording:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  getStream(): MediaStream | null {
    return this.stream;
  }
}

