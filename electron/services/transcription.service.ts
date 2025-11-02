import OpenAI from 'openai';
import fs from 'fs';
import { ConfigService } from './config.service';

export class TranscriptionService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async transcribe(audioFilePath: string): Promise<string> {
    const provider = this.configService.getProvider('transcription');
    const apiKey = this.configService.getApiKey('transcription');

    if (!apiKey) {
      throw new Error('Transcription API key not configured');
    }

    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found');
    }

    switch (provider) {
      case 'openai':
        return await this.transcribeWithOpenAI(audioFilePath, apiKey);
      case 'assemblyai':
        throw new Error('AssemblyAI not yet implemented');
      case 'google':
        throw new Error('Google Speech-to-Text not yet implemented');
      default:
        throw new Error(`Unknown transcription provider: ${provider}`);
    }
  }

  private async transcribeWithOpenAI(audioFilePath: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({
      apiKey,
      timeout: 60000, // 60 second timeout
      maxRetries: 2,
    });

    try {
      // Check file size
      const stats = fs.statSync(audioFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`Transcribing file: ${audioFilePath} (${fileSizeMB.toFixed(2)} MB)`);

      if (fileSizeMB > 25) {
        throw new Error('Audio file is too large (max 25MB for OpenAI Whisper)');
      }

      const audioFile = fs.createReadStream(audioFilePath);

      // Use gpt-4o-transcribe for better quality (falls back to whisper-1 if it fails)
      let model = 'gpt-4o-transcribe';

      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: model, // gpt-4o-transcribe (newer, better) or whisper-1 (classic)
        language: 'en',
        response_format: 'text',
      });

      return response as unknown as string;
    } catch (error) {
      console.error('OpenAI transcription error:', error);

      // Better error messages
      const errMsg = (error as Error).message;
      if (errMsg.includes('Connection') || errMsg.includes('ECONNRESET')) {
        throw new Error('Network connection failed. Check your internet connection and try again.');
      } else if (errMsg.includes('API key')) {
        throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
      } else if (errMsg.includes('quota') || errMsg.includes('billing')) {
        throw new Error('OpenAI API quota exceeded or billing issue. Check your OpenAI account.');
      } else {
        throw new Error(`Transcription failed: ${errMsg}`);
      }
    }
  }
}
