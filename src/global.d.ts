// TypeScript declarations for Electron API exposed via contextBridge

import { Meeting, APIConfig } from './types';

interface ElectronAPI {
  // Permissions
  checkScreenPermission: () => Promise<{ granted: boolean }>;
  requestScreenPermission: () => Promise<{ granted: boolean }>;

  // System audio recording (via Swift recorder)
  startRecording: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  stopRecording: () => Promise<{ success: boolean; filePath?: string; error?: string }>;

  // Meeting management
  saveMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  getMeetings: () => Promise<{ success: boolean; meetings?: Meeting[]; error?: string }>;
  getMeeting: (id: string) => Promise<{ success: boolean; meeting?: Meeting; error?: string }>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<{ success: boolean; error?: string }>;
  deleteMeeting: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Transcription and summary
  transcribeAudio: (filePath: string) => Promise<{ success: boolean; transcript?: string; error?: string }>;
  generateSummary: (transcript: string) => Promise<{ success: boolean; summary?: string; title?: string; error?: string }>;
  generateMeetingTitle: (summary: string) => Promise<{ success: boolean; title?: string; error?: string }>;

  // Config
  getConfig: () => Promise<{ success: boolean; config?: APIConfig; error?: string }>;
  saveConfig: (config: APIConfig) => Promise<{ success: boolean; error?: string }>;

  // Export
  exportMeeting: (meetingId: string, format: 'md' | 'txt') => Promise<{ success: boolean; content?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
