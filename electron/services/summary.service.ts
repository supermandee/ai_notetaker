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
    console.log(`Transcript length: ${transcript.length} characters`);

    const startTime = Date.now();

    // Use Responses API for all models
    const systemPrompt = `You are an expert meeting analyst and professional summarizer. Your task is to create a comprehensive and detailed summary of the meeting transcript.

Follow this template structure:\n\n${template}\n\nInclude all key discussions, decisions, action items (with owners and deadlines), concerns raised, and next steps. Be thorough and detailed.`;

    const userPrompt = `Please summarize this meeting transcript:\n\n${transcript}`;

    // Check if this is a reasoning model (gpt-5 or o-series)
    const isReasoningModel = model.startsWith('gpt-5') || model.startsWith('o3') || model.startsWith('o1');

    console.log(`Using Responses API for ${model}`);

    try {
      const requestParams: any = {
        model: model,
        input: `${systemPrompt}\n\n${userPrompt}`,
        text: {
          verbosity: 'medium'
        },
        max_output_tokens: isReasoningModel ? 6000 : 2000, // Higher limit for reasoning models
      };

      // Only add reasoning config for reasoning models
      if (isReasoningModel) {
        requestParams.reasoning = {
          effort: 'low' // Use low to reduce reasoning tokens and leave more for output
        };
        // Note: Reasoning models don't support temperature, top_p, or logprobs
      } else {
        // Non-reasoning models support temperature
        requestParams.temperature = 0.7;
      }

      const response = await openai.responses.create(requestParams as any);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`Summary generation took ${duration} seconds`);

      // Check response status
      const status = (response as any).status;
      console.log(`Response status: ${status}`);

      if (status === 'incomplete') {
        const reason = (response as any).incomplete_details?.reason;
        console.error(`Response incomplete. Reason: ${reason}`);

        if (reason === 'max_output_tokens') {
          throw new Error('Summary generation hit token limit. The response was too long. Try with a shorter transcript or increase max_output_tokens.');
        }
        throw new Error(`Summary generation incomplete: ${reason}`);
      }

      // Extract text from response - try helper first, then find message item
      let content = (response as any).output_text;

      if (!content) {
        // Find the message item in output array
        const messageItem = (response as any).output?.find((item: any) => item.type === 'message');
        if (messageItem?.content?.[0]?.text) {
          content = messageItem.content[0].text;
        }
      }

      console.log(`Generated summary length: ${content?.length || 0} characters`);

      if (!content || content.trim().length === 0) {
        console.error('ERROR: OpenAI Responses API returned empty content!');
        console.error('Full response:', JSON.stringify(response, null, 2));
        throw new Error('Model returned empty summary. Check console for details.');
      }

      return content;
    } catch (error: any) {
      console.error('OpenAI Responses API error:', error);
      console.error('Error details:', {
        type: error.constructor?.name,
        status: error.status,
        code: error.code,
        message: error.message,
      });
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }
}
