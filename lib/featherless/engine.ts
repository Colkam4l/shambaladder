import { callFeatherless } from './client';
import { SYSTEM_PROMPT } from './templates';

const MAX_RETRIES = 2;

export async function generateWithRetry<T>(
  templateName: string,
  prompt: string,
  parser: (raw: string) => T
): Promise<T> {
  let lastError: unknown;
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callFeatherless({
        model: process.env.FEATHERLESS_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: currentPrompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      });

      return parser(raw);
    } catch (error) {
      lastError = error;
      console.warn(`[Featherless] ${templateName} attempt ${attempt + 1} failed:`, error);

      if (attempt < MAX_RETRIES) {
        currentPrompt = prompt + '\n\nIMPORTANT: Respond with valid JSON only. No other text before or after the JSON object.';
      }
    }
  }

  throw new Error(`[Featherless] ${templateName} failed after ${MAX_RETRIES + 1} attempts: ${lastError}`);
}
