export interface Meeting {
  id: string;
  title: string;
  date: number;
  duration: number;
  audioFilePath: string;
  transcript?: string;
  summary?: string;
  status: 'recorded' | 'transcribing' | 'transcribed' | 'summarizing' | 'summarized';
  createdAt: number;
  updatedAt: number;
}

export interface APIConfig {
  transcriptionProvider: 'openai' | 'assemblyai' | 'google';
  transcriptionApiKey: string;
  transcriptionModel?: string; // OpenAI model selection
  llmProvider: 'openai' | 'anthropic' | 'google';
  llmApiKey: string;
  llmModel?: string; // LLM model selection
  summaryTemplate: string;
}

export interface AudioSource {
  id: string;
  name: string;
  thumbnail: string;
}

export interface ElectronAPI {
  getAudioSources: () => Promise<AudioSource[]>;
  startRecording: (sourceId: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  stopRecording: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  saveMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  getMeetings: () => Promise<{ success: boolean; meetings?: Meeting[]; error?: string }>;
  getMeeting: (id: string) => Promise<{ success: boolean; meeting?: Meeting; error?: string }>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<{ success: boolean; error?: string }>;
  deleteMeeting: (id: string) => Promise<{ success: boolean; error?: string }>;
  transcribeAudio: (filePath: string) => Promise<{ success: boolean; transcript?: string; error?: string }>;
  generateSummary: (transcript: string) => Promise<{ success: boolean; summary?: string; error?: string }>;
  getConfig: () => Promise<{ success: boolean; config?: APIConfig; error?: string }>;
  saveConfig: (config: APIConfig) => Promise<{ success: boolean; error?: string }>;
  exportMeeting: (meetingId: string, format: 'md' | 'txt') => Promise<{ success: boolean; content?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
