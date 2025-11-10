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
