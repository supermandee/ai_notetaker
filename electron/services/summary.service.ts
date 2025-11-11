import OpenAI from 'openai';
import { ConfigService } from './config.service';

export class SummaryService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async generateSummary(transcript: string): Promise<{ summary: string; title?: string }> {
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

  private async summarizeWithOpenAI(transcript: string, apiKey: string): Promise<{ summary: string; title?: string }> {
    const openai = new OpenAI({ apiKey });
    const template = this.configService.getSummaryTemplate();
    const model = this.configService.getModel('llm');

    console.log(`Using model for summary: ${model}`);
    console.log(`Transcript length: ${transcript.length} characters`);

    const startTime = Date.now();

    // Use Responses API for all models
    const systemPrompt = `You are an expert meeting analyst and professional summarizer. Your task is to create a clear, concise summary that captures all important information from the meeting.

FIRST: Generate a concise, descriptive meeting title (3-7 words) based on the main topic discussed. Output this on the very first line as: TITLE: [Your Generated Title]

THEN: Use this EXACT template structure and fill in the content. Keep all headings, sections, and formatting exactly as shown:

${template}

Fill in each section with the relevant information from the meeting. Be concise but comprehensive - include all key discussions, decisions, action items, concerns raised, and important context. Write clearly so anyone who missed the meeting can understand what was discussed and decided.

IMPORTANT:
- The first line MUST be the title in format: TITLE: [Your Generated Title]
- Keep all markdown headings (##, ###) exactly as they appear in the template
- Use **bold** for emphasis on key points and important terms within sections
- Fill in bullet points with actual content from the meeting
- Preserve all section dividers (---) from the template`;

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

      // Extract title from the first line if present
      let title: string | undefined;
      let summary = content;

      const titleMatch = content.match(/^TITLE:\s*(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
        // Remove the title line from the summary
        summary = content.replace(/^TITLE:\s*.+\n?/m, '').trim();
        console.log(`Extracted title: ${title}`);
      }

      return { summary, title };
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

  async generateMeetingTitle(summary: string): Promise<string> {
    const provider = this.configService.getProvider('llm');
    const apiKey = this.configService.getApiKey('llm');

    if (!apiKey) {
      throw new Error('LLM API key not configured');
    }

    if (!summary || summary.trim().length === 0) {
      throw new Error('Summary is empty');
    }

    switch (provider) {
      case 'openai':
        return await this.generateTitleWithOpenAI(summary, apiKey);
      case 'anthropic':
        throw new Error('Anthropic not yet implemented');
      case 'google':
        throw new Error('Google Gemini not yet implemented');
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }

  private async generateTitleWithOpenAI(summary: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    const model = this.configService.getModel('llm');

    console.log(`Generating meeting title with ${model}`);

    const startTime = Date.now();
    const isReasoningModel = model.startsWith('gpt-5') || model.startsWith('o3') || model.startsWith('o1');

    console.log(`Using Responses API for ${model}`);

    try {
      const requestParams: any = {
        model: model,
        input: `Analyze this meeting summary and provide a concise meeting title (3-7 words maximum).

INSTRUCTIONS:
- If the summary contains a clear "Meeting Title" or "Topic" heading, extract and return that exact title
- If no clear title exists in the summary, generate a descriptive title based on the main discussion topic
- Return ONLY the title text, nothing else (no quotes, no extra formatting)

Summary:
${summary}`,
        text: {
          verbosity: 'low'
        },
        max_output_tokens: 100,
      };

      if (isReasoningModel) {
        requestParams.reasoning = {
          effort: 'low'
        };
      } else {
        requestParams.temperature = 0.7;
      }

      const response = await openai.responses.create(requestParams as any);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`Title generation took ${duration} seconds`);

      // Check response status
      const status = (response as any).status;
      console.log(`Response status: ${status}`);

      if (status === 'incomplete') {
        const reason = (response as any).incomplete_details?.reason;
        console.error(`Response incomplete. Reason: ${reason}`);
        throw new Error(`Title generation incomplete: ${reason}`);
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

      console.log(`Generated title length: ${content?.length || 0} characters`);

      if (!content || content.trim().length === 0) {
        console.error('ERROR: OpenAI Responses API returned empty content!');
        console.error('Full response:', JSON.stringify(response, null, 2));
        throw new Error('Model returned empty title. Check console for details.');
      }

      // Clean up the title: remove quotes, asterisks, and other markdown formatting
      let cleanTitle = content.trim()
        .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
        .replace(/[*_#\[\]]/g, '') // Remove markdown formatting
        .replace(/^[:\-\s]+|[:\-\s]+$/g, '') // Remove leading/trailing colons, dashes, spaces
        .trim();

      return cleanTitle;
    } catch (error: any) {
      console.error('OpenAI Responses API error:', error);
      console.error('Error details:', {
        type: error.constructor?.name,
        status: error.status,
        code: error.code,
        message: error.message,
      });
      throw new Error(`Title generation failed: ${error.message}`);
    }
  }
}
