import fs from 'fs';
import path from 'path';
import { Meeting } from '../types';

export class AudioService {
  private recordingsPath: string;
  private currentRecordingPath: string | null = null;
  private recordingStartTime: number | null = null;

  constructor(userDataPath: string) {
    this.recordingsPath = path.join(userDataPath, 'recordings');
    if (!fs.existsSync(this.recordingsPath)) {
      fs.mkdirSync(this.recordingsPath, { recursive: true });
    }
  }

  async startRecording(sourceId: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `recording_${timestamp}.webm`;
    this.currentRecordingPath = path.join(this.recordingsPath, fileName);
    this.recordingStartTime = timestamp;

    // Note: Actual recording will be handled by the renderer process
    // using MediaRecorder API with the selected source
    // This service just manages file paths and metadata

    return this.currentRecordingPath;
  }

  async stopRecording(): Promise<string> {
    if (!this.currentRecordingPath) {
      throw new Error('No active recording');
    }

    const filePath = this.currentRecordingPath;
    this.currentRecordingPath = null;
    this.recordingStartTime = null;

    return filePath;
  }

  getRecordingDuration(): number {
    if (!this.recordingStartTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  async saveAudioFile(buffer: Buffer, fileName: string): Promise<string> {
    const filePath = path.join(this.recordingsPath, fileName);
    // Save the webm audio file (audio-only recording from microphone)
    // OpenAI Whisper accepts webm format directly
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  deleteRecording(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  exportAsMarkdown(meeting: Meeting): string {
    let markdown = `# ${meeting.title}\n\n`;
    markdown += `**Date:** ${new Date(meeting.date).toLocaleString()}\n`;
    markdown += `**Duration:** ${this.formatDuration(meeting.duration)}\n\n`;

    if (meeting.summary) {
      markdown += `## Summary\n\n${meeting.summary}\n\n`;
    }

    if (meeting.transcript) {
      markdown += `## Full Transcript\n\n${meeting.transcript}\n`;
    }

    return markdown;
  }

  exportAsText(meeting: Meeting): string {
    let text = `${meeting.title}\n`;
    text += `${'='.repeat(meeting.title.length)}\n\n`;
    text += `Date: ${new Date(meeting.date).toLocaleString()}\n`;
    text += `Duration: ${this.formatDuration(meeting.duration)}\n\n`;

    if (meeting.summary) {
      text += `SUMMARY\n-------\n\n${meeting.summary}\n\n`;
    }

    if (meeting.transcript) {
      text += `FULL TRANSCRIPT\n---------------\n\n${meeting.transcript}\n`;
    }

    return text;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}
