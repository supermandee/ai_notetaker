import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from './config.service';

const execPromise = promisify(exec);

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

  private async splitAudioFile(audioFilePath: string, maxChunkDurationSeconds: number = 120): Promise<string[]> {
    const fileExt = path.extname(audioFilePath);
    const fileDir = path.dirname(audioFilePath);
    const fileBaseName = path.basename(audioFilePath, fileExt);

    // Get total duration of the audio file
    const totalDurationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`;
    const { stdout: durationOutput } = await execPromise(totalDurationCmd);
    const totalDuration = parseFloat(durationOutput.trim());

    // Calculate number of chunks based on max duration (e.g., 2 minutes)
    const numChunks = Math.ceil(totalDuration / maxChunkDurationSeconds);

    const chunkPaths: string[] = [];

    console.log(`Splitting ${totalDuration.toFixed(0)}s audio into ${numChunks} chunks of max ${maxChunkDurationSeconds}s each`);

    // Split the file into chunks with proper re-encoding
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * maxChunkDurationSeconds;
      const chunkPath = path.join(fileDir, `${fileBaseName}_chunk_${i}.flac`);

      // Re-encode audio to FLAC format with lower sample rate to reduce size
      // This ensures valid audio frames and smaller file sizes
      const splitCmd = `ffmpeg -i "${audioFilePath}" -ss ${startTime} -t ${maxChunkDurationSeconds} -acodec flac -ar 16000 "${chunkPath}" -y`;
      await execPromise(splitCmd);

      chunkPaths.push(chunkPath);
      console.log(`Created chunk ${i + 1}/${numChunks}: ${chunkPath}`);
    }

    return chunkPaths;
  }

  private async transcribeWithOpenAI(audioFilePath: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({
      apiKey,
      timeout: 300000, // 5 minute timeout for large audio files
      maxRetries: 2,
    });

    try {
      // Check file size
      const stats = fs.statSync(audioFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`Transcribing file: ${audioFilePath} (${fileSizeMB.toFixed(2)} MB)`);

      let chunkPaths: string[] = [];
      let needsCleanup = false;

      // If file is too large, split it into chunks
      if (fileSizeMB > 25) {
        console.log('File exceeds 25MB limit, splitting into chunks...');
        chunkPaths = await this.splitAudioFile(audioFilePath, 120); // 2-minute chunks
        needsCleanup = true;
      } else {
        // Use the original file
        chunkPaths = [audioFilePath];
      }

      // Transcribe each chunk
      const transcriptions: string[] = [];
      const model = 'gpt-4o-transcribe'; // Use gpt-4o-transcribe for better quality

      for (let i = 0; i < chunkPaths.length; i++) {
        const chunkPath = chunkPaths[i];
        console.log(`Transcribing chunk ${i + 1}/${chunkPaths.length}: ${chunkPath}`);

        const audioFile = fs.createReadStream(chunkPath);

        const response = await openai.audio.transcriptions.create({
          file: audioFile,
          model: model, // gpt-4o-transcribe (newer, better) or whisper-1 (classic)
          language: 'en',
          response_format: 'text',
        });

        transcriptions.push(response as unknown as string);
        console.log(`Completed chunk ${i + 1}/${chunkPaths.length}`);
      }

      // Cleanup temporary chunk files
      if (needsCleanup) {
        console.log('Cleaning up temporary chunk files...');
        for (const chunkPath of chunkPaths) {
          try {
            fs.unlinkSync(chunkPath);
            console.log(`Deleted: ${chunkPath}`);
          } catch (err) {
            console.warn(`Failed to delete chunk: ${chunkPath}`, err);
          }
        }
      }

      // Combine all transcriptions
      const fullTranscription = transcriptions.join(' ');
      console.log(`Transcription complete: ${fullTranscription.length} characters`);

      return fullTranscription;
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
