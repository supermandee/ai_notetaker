import { Meeting } from '../types';

export class AudioService {
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
