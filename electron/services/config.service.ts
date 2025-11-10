import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import fs from 'fs';
import path from 'path';
import { APIConfig } from '../types';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

export class ConfigService {
  private configPath: string;
  private keyPath: string;
  private encryptionKey: Buffer;

  constructor(userDataPath: string) {
    this.configPath = path.join(userDataPath, 'config.enc');
    this.keyPath = path.join(userDataPath, '.key');
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  private getOrCreateEncryptionKey(): Buffer {
    try {
      if (fs.existsSync(this.keyPath)) {
        return fs.readFileSync(this.keyPath);
      }
    } catch (error) {
      // If we can't read the key, create a new one
    }

    const key = randomBytes(KEY_LENGTH);
    fs.writeFileSync(this.keyPath, key, { mode: 0o600 });
    return key;
  }

  getConfig(): APIConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        return this.getDefaultConfig();
      }

      const encryptedData = fs.readFileSync(this.configPath);
      const decrypted = this.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error reading config:', error);
      return this.getDefaultConfig();
    }
  }

  saveConfig(config: APIConfig): void {
    const jsonString = JSON.stringify(config, null, 2);
    const encrypted = this.encrypt(jsonString);
    fs.writeFileSync(this.configPath, encrypted, { mode: 0o600 });
  }

  private encrypt(text: string): Buffer {
    const salt = randomBytes(SALT_LENGTH);
    const key = scryptSync(this.encryptionKey, salt, KEY_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]);
  }

  private decrypt(encryptedData: Buffer): string {
    const salt = encryptedData.subarray(0, SALT_LENGTH);
    const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = encryptedData.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = scryptSync(this.encryptionKey, salt, KEY_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  private getDefaultConfig(): APIConfig {
    return {
      transcriptionProvider: 'openai',
      transcriptionApiKey: '',
      transcriptionModel: 'gpt-4o-transcribe',
      llmProvider: 'openai',
      llmApiKey: '',
      llmModel: 'gpt-5',
      summaryTemplate: `# Meeting Summary

## Key Points
- [Main discussion points]

## Decisions Made
- [Decisions and conclusions]

## Action Items
- [Tasks and assignments]

## Next Steps
- [Follow-up actions]`,
    };
  }

  getApiKey(provider: 'transcription' | 'llm'): string {
    const config = this.getConfig();
    return provider === 'transcription' ? config.transcriptionApiKey : config.llmApiKey;
  }

  getProvider(type: 'transcription' | 'llm'): string {
    const config = this.getConfig();
    return type === 'transcription' ? config.transcriptionProvider : config.llmProvider;
  }

  getSummaryTemplate(): string {
    const config = this.getConfig();
    return config.summaryTemplate;
  }

  getModel(type: 'transcription' | 'llm'): string {
    const config = this.getConfig();
    if (type === 'transcription') {
      return config.transcriptionModel || 'gpt-4o-transcribe';
    } else {
      return config.llmModel || 'gpt-5';
    }
  }
}
