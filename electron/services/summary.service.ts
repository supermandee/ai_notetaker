import OpenAI from 'openai';
import { ConfigService } from './config.service';

export class SummaryService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async generateSummary(transcript: string): Promise<string> {
    const provider = this.configService.getProvider('llm');
    const apiKey = this.configService.getApiKey('llm');

    if (!apiKey) {
      throw new Error('LLM API key not configured');
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty');
    }

    switch (provider) {
      case 'openai':
        return await this.summarizeWithOpenAI(transcript, apiKey);
      case 'anthropic':
        throw new Error('Anthropic not yet implemented');
      case 'google':
        throw new Error('Google Gemini not yet implemented');
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }

  private async summarizeWithOpenAI(transcript: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    const template = this.configService.getSummaryTemplate();
    const model = this.configService.getModel('llm');

    console.log(`Using model for summary: ${model}`);

    // GPT-5 models use max_completion_tokens and don't support custom temperature
    const isGpt5Model = model.startsWith('gpt-5');
    const completionParams: any = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a professional meeting summarizer. Generate a concise, well-structured summary of the meeting transcript following this template:\n\n${template}\n\nExtract the key points, decisions, and action items accurately.`,
        },
        {
          role: 'user',
          content: `Please summarize the following meeting transcript:\n\n${transcript}`,
        },
      ],
    };

    if (isGpt5Model) {
      completionParams.max_completion_tokens = 1500;
      // GPT-5 models only support default temperature (1)
    } else {
      completionParams.max_tokens = 1500;
      completionParams.temperature = 0.3;
    }

    try {
      const response = await openai.chat.completions.create(completionParams);

      return response.choices[0].message.content || 'Failed to generate summary';
    } catch (error) {
      console.error('OpenAI summary error:', error);
      throw new Error(`Summary generation failed: ${(error as Error).message}`);
    }
  }
}
