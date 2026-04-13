/**
 * Tarot reading proxy worker.
 *
 * POST /reading
 *   Body: { cards: [{ name, position, orientation, meaning }, ...] }
 *   Returns: { reading: string }
 *
 * The prompt is constructed server-side so the client never touches it.
 * ANTHROPIC_API_KEY is stored as a Worker secret (never in source).
 *
 * Rate limiting note: client-side localStorage is the primary daily limit.
 * Add Cloudflare rate limiting rules in the dashboard (Workers > your worker >
 * Settings > Rate Limiting) if you ever need server-side enforcement.
 */

export interface Env {
  ANTHROPIC_API_KEY: string;
}

interface CardInput {
  name:        string;
  position:    string;
  orientation: 'upright' | 'reversed';
  meaning:     string;
}

const ALLOWED_ORIGINS = [
  'https://stephendove.com',
  'https://www.stephendove.com',
  'http://localhost:5173',
  'http://localhost:4321',
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin':  allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/reading') {
      return handleReading(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleReading(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  let body: { cards: CardInput[] };

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, cors);
  }

  if (!Array.isArray(body.cards) || body.cards.length !== 3) {
    return jsonResponse({ error: 'Expected exactly 3 cards' }, 400, cors);
  }

  const [past, present, future] = body.cards;

  const prompt = buildPrompt(past, present, future);

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      console.error('Anthropic error:', anthropicRes.status, text);
      return jsonResponse({ error: 'Reading unavailable', debug: `${anthropicRes.status}: ${text}` }, 502, cors);
    }

    const data = await anthropicRes.json() as {
      content: { type: string; text: string }[];
    };

    const reading = data.content?.find(b => b.type === 'text')?.text ?? '';
    return jsonResponse({ reading }, 200, cors);

  } catch (err) {
    console.error('Worker error:', err);
    return jsonResponse({ error: 'Internal error' }, 500, cors);
  }
}

function buildPrompt(
  past:    CardInput,
  present: CardInput,
  future:  CardInput,
): string {
  function cardLine(c: CardInput): string {
    const rev = c.orientation === 'reversed' ? ' (reversed)' : '';
    return `${c.position.toUpperCase()}: ${c.name}${rev}\n  Traditional meaning: ${c.meaning}`;
  }

  return `You are an insightful tarot reader giving a three-card past/present/future reading.

The querent drew:

${cardLine(past)}

${cardLine(present)}

${cardLine(future)}

Write a concise three-paragraph reading (one short paragraph per position, 2-3 sentences each) that weaves these cards into a coherent narrative. Address the querent as "you". Let the cards inform the story rather than listing meanings mechanically. End with one brief grounded reflection or question for them to sit with today. Tone: warm, thoughtful, not sycophantic. Avoid em-dashes. Plain prose only — no markdown, no headers, no bullet points.`;
}

function jsonResponse(
  body:    unknown,
  status:  number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
