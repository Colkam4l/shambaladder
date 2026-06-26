const FEATHERLESS_API_URL = 'https://api.featherless.ai/v1/chat/completions';

export interface FeatherlessRequest {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  max_tokens: number;
  temperature: number;
}

export async function callFeatherless(req: FeatherlessRequest): Promise<string> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('FEATHERLESS_API_KEY environment variable is not set');
  }

  const response = await fetch(FEATHERLESS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Featherless API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    throw new Error('Featherless API response does not contain choices');
  }
  
  return data.choices[0].message.content as string;
}
