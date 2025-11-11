import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Permissions
  checkScreenPermission: () => ipcRenderer.invoke('check-screen-permission'),
  requestScreenPermission: () => ipcRenderer.invoke('request-screen-permission'),

  // System audio recording (via Swift recorder)
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),

  // Meeting management
  saveMeeting: (meeting: any) => ipcRenderer.invoke('save-meeting', meeting),
  getMeetings: () => ipcRenderer.invoke('get-meetings'),
  getMeeting: (id: string) => ipcRenderer.invoke('get-meeting', id),
  updateMeeting: (id: string, updates: any) => ipcRenderer.invoke('update-meeting', id, updates),
  deleteMeeting: (id: string) => ipcRenderer.invoke('delete-meeting', id),

  // Transcription and summary
  transcribeAudio: (filePath: string) => ipcRenderer.invoke('transcribe-audio', filePath),
  generateSummary: (transcript: string) => ipcRenderer.invoke('generate-summary', transcript),
  generateMeetingTitle: (summary: string) => ipcRenderer.invoke('generate-meeting-title', summary),

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),

  // Export
  exportMeeting: (meetingId: string, format: 'md' | 'txt') =>
    ipcRenderer.invoke('export-meeting', meetingId, format),
});
