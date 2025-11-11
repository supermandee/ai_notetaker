import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export class SystemAudioService {
  private recordingProcess: ChildProcess | null = null;
  private recordingsPath: string;
  private currentRecordingPath: string | null = null;
  private swiftBinaryPath: string;

  constructor(userDataPath: string, appPath: string) {
    this.recordingsPath = path.join(userDataPath, 'recordings');
    if (!fs.existsSync(this.recordingsPath)) {
      fs.mkdirSync(this.recordingsPath, { recursive: true });
    }

    // In production, unpacked files are in app.asar.unpacked
    // In development, we're in the project root
    const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
    const binaryPath = path.join(unpackedPath, 'swift', 'Recorder');

    // Use unpacked path if it exists, otherwise use regular path (for dev mode)
    this.swiftBinaryPath = fs.existsSync(binaryPath)
      ? binaryPath
      : path.join(appPath, 'swift', 'Recorder');
  }

  async checkPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      const childProcess = spawn(this.swiftBinaryPath, ['--check-permissions']);

      childProcess.stdout.on('data', (data) => {
        try {
          const response = JSON.parse(data.toString());
          resolve(response.code === 'PERMISSION_GRANTED');
        } catch {
          resolve(false);
        }
      });

      childProcess.on('error', () => resolve(false));
    });
  }

  async startRecording(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return new Promise((resolve) => {
      const timestamp = Date.now();
      const filename = `recording_${timestamp}`;

      console.log('Starting Swift recorder:', this.swiftBinaryPath);
      console.log('Recording to:', this.recordingsPath);

      this.recordingProcess = spawn(this.swiftBinaryPath, [
        '--record',
        this.recordingsPath,
        '--filename',
        filename
      ]);

      this.recordingProcess.stdout?.on('data', (data) => {
        const responses = data
          .toString()
          .split('\n')
          .filter((line: string) => line.trim() !== '')
          .map((line: string) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter((r: any) => r !== null);

        for (const response of responses) {
          console.log('Swift recorder response:', response);

          if (response.code === 'RECORDING_STARTED') {
            this.currentRecordingPath = response.path;
            resolve({ success: true, filePath: response.path });
          } else if (response.code === 'PERMISSION_DENIED') {
            resolve({ success: false, error: 'Screen recording permission denied' });
          } else if (response.code === 'NO_DISPLAY_FOUND') {
            const isDev = process.env.NODE_ENV === 'development';
            if (isDev) {
              resolve({
                success: false,
                error: 'Screen Recording permission needed for development.\n\nPlease run: ./grant-dev-permission.sh\n\nOr manually grant Screen Recording permission to your terminal app in System Settings > Privacy & Security > Screen Recording'
              });
            } else {
              resolve({ success: false, error: 'No display found. Please check Screen Recording permissions in System Settings.' });
            }
          } else if (response.code === 'CAPTURE_FAILED') {
            resolve({ success: false, error: 'Failed to start audio capture' });
          } else if (response.code !== 'RECORDING_STOPPED') {
            resolve({ success: false, error: `Recorder error: ${response.code}` });
          }
        }
      });

      this.recordingProcess.on('error', (error) => {
        console.error('Swift recorder process error:', error);
        resolve({ success: false, error: error.message });
      });

      // Timeout if no response in 5 seconds
      setTimeout(() => {
        if (this.currentRecordingPath === null) {
          this.stopRecording();
          resolve({ success: false, error: 'Recording start timeout' });
        }
      }, 5000);
    });
  }

  stopRecording(): { success: boolean; filePath?: string; error?: string } {
    if (!this.recordingProcess) {
      return { success: false, error: 'No active recording' };
    }

    const filePath = this.currentRecordingPath;

    try {
      this.recordingProcess.kill('SIGINT');
      this.recordingProcess = null;
      this.currentRecordingPath = null;

      return { success: true, filePath: filePath || undefined };
    } catch (error) {
      console.error('Error stopping recording:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  deleteRecording(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
