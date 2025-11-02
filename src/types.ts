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
  llmProvider: 'openai' | 'anthropic' | 'google';
  llmApiKey: string;
  summaryTemplate: string;
}

export interface AudioSource {
  id: string;
  name: string;
  thumbnail: string;
}
