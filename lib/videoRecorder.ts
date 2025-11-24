// Video recording utility
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private videoElement: HTMLVideoElement | null = null;

  async startRecording(
    videoElement: HTMLVideoElement,
    onDataAvailable?: (blob: Blob) => void
  ): Promise<void> {
    try {
      // Request camera and microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
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

      // Set up MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000
      };

      // Fallback to default if codec not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
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

