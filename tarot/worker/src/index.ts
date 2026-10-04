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

import { EmailMessage } from 'cloudflare:email';

export interface Env {
  ANTHROPIC_API_KEY: string;
  RELAY_POLL:        KVNamespace;
  POLL_EMAIL:        SendEmail;
  NOTIFY_EMAILS?:    string;
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
  'https://stephenrdove.github.io',
  'http://localhost:5173',
  'http://localhost:4321',
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin':  allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const url = new URL(request.url);

    if (url.pathname.startsWith('/dinnerboard')) {
      return handleDinnerboard(request, allowedOrigin);
    }

    if (url.pathname === '/relay-poll') {
      return handleRelayPoll(request, env, ctx, allowedOrigin);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === 'POST' && url.pathname === '/reading') {
      return handleReading(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleDinnerboard(request: Request, origin: string): Promise<Response> {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/dinnerboard/, '') || '/';
  const targetUrl = `https://dinnerboard.stephendove-tarot.workers.dev${targetPath}`;

  const proxyReq = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined,
  });

  const res = await fetch(proxyReq);
  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * New Horizons relay poll.
 *
 * GET  /relay-poll  → { responses: PollResponse[] }
 * POST /relay-poll  Body: PollResponse → { ok: true }
 *
 * Each response is stored under its own KV key (keyed by lowercased name, so
 * re-submitting the same name updates it). The response also rides along as
 * key metadata, so a single list() call returns everything.
 */
const POLL_PREFIX = 'nh2026:';
const POLL_DATES  = new Map([
  ['2026-10-24', 'Sat, Oct 24'],
  ['2026-10-25', 'Sun, Oct 25'],
  ['2026-11-01', 'Sun, Nov 1'],
  ['2026-11-08', 'Sun, Nov 8'],
  ['2026-11-14', 'Sat, Nov 14'],
  ['2026-11-15', 'Sun, Nov 15'],
]);
const POLL_LEGS   = new Map([
  ['sun-mars',       'Sun to Mars'],
  ['mars-saturn',    'Mars to Saturn'],
  ['saturn-uranus',  'Saturn to Uranus'],
  ['uranus-neptune', 'Uranus to Neptune'],
  ['neptune-pluto',  'Neptune to Pluto'],
]);
const POLL_BRIX   = new Set(['yes', 'maybe', 'no', '']);

interface PollResponse {
  name:  string;
  dates: Record<string, 'yes' | 'maybe'>;
  legs:  string[];
  brix:  'yes' | 'maybe' | 'no' | '';
  note:  string;
}

async function handleRelayPoll(
  request: Request,
  env:     Env,
  ctx:     ExecutionContext,
  origin:  string,
): Promise<Response> {
  const cors: Record<string, string> = {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method === 'GET') {
    const responses: PollResponse[] = [];
    let cursor: string | undefined;
    do {
      const page = await env.RELAY_POLL.list<PollResponse>({ prefix: POLL_PREFIX, cursor });
      for (const key of page.keys) if (key.metadata) responses.push(key.metadata);
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return jsonResponse({ responses }, 200, { ...cors, 'Cache-Control': 'no-store' });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, cors);
  }

  let body: Partial<PollResponse>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, cors);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (!name || name.length > 40 || note.length > 200) {
    return jsonResponse({ error: 'Name is required (max 40 chars); note max 200 chars' }, 400, cors);
  }

  const dates: PollResponse['dates'] = {};
  for (const [date, answer] of Object.entries(body.dates ?? {})) {
    if (!POLL_DATES.has(date) || (answer !== 'yes' && answer !== 'maybe')) {
      return jsonResponse({ error: 'Invalid date selection' }, 400, cors);
    }
    dates[date] = answer;
  }

  const legs = Array.isArray(body.legs) ? body.legs : [];
  if (!legs.every(l => typeof l === 'string' && POLL_LEGS.has(l))) {
    return jsonResponse({ error: 'Invalid leg selection' }, 400, cors);
  }

  const brix = body.brix ?? '';
  if (!POLL_BRIX.has(brix)) {
    return jsonResponse({ error: 'Invalid Brix answer' }, 400, cors);
  }

  const response: PollResponse = { name, dates, legs: [...new Set(legs)], brix, note };
  const key = POLL_PREFIX + name.toLowerCase();
  const isUpdate = (await env.RELAY_POLL.getWithMetadata(key)).metadata !== null;
  await env.RELAY_POLL.put(key, '', { metadata: response });

  // Email in the background so a mail hiccup never fails the submission
  ctx.waitUntil(notifyPollResponse(env, response, isUpdate).catch(err => {
    console.error('Poll email failed:', err);
  }));

  return jsonResponse({ ok: true }, 200, cors);
}

/**
 * Emails each address in the NOTIFY_EMAILS secret (comma-separated) via
 * Cloudflare Email Routing. Recipients live in a secret rather than
 * wrangler.toml to keep them out of the public repo; each one must be a
 * verified destination address in Email Routing.
 */
async function notifyPollResponse(env: Env, r: PollResponse, isUpdate: boolean): Promise<void> {
  const recipients = (env.NOTIFY_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (recipients.length === 0) return;

  const dateLines = [...POLL_DATES]
    .filter(([id]) => r.dates[id])
    .map(([id, label]) => `  ${label}: ${r.dates[id]}`);

  const subject = `${r.name} ${isUpdate ? 'updated' : 'filled out'} the relay poll`;
  const text = [
    `${subject}.`,
    '',
    'Dates:',
    ...(dateLines.length ? dateLines : ['  (none)']),
    '',
    `Legs: ${r.legs.map(id => POLL_LEGS.get(id)).join(', ') || '(none)'}`,
    `Brix: ${r.brix || '(no answer)'}`,
    ...(r.note ? [`Note: ${r.note}`] : []),
    '',
    'All results: https://stephendove.com/new_horizons/2026#poll',
  ].join('\r\n');

  const from = 'poll@stephendove.com';
  for (const to of recipients) {
    const raw = [
      `From: New Horizons Poll <${from}>`,
      `To: ${to}`,
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@stephendove.com>`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text,
    ].join('\r\n');
    await env.POLL_EMAIL.send(new EmailMessage(from, to, raw));
  }
}

/** RFC 2047 encoded-word, so names with accents (or stray newlines) are safe in a header. */
function encodeHeader(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return `=?UTF-8?B?${btoa(String.fromCharCode(...bytes))}?=`;
}

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

  const VALID_POSITIONS    = new Set(['Past', 'Present', 'Future']);
  const VALID_ORIENTATIONS = new Set(['upright', 'reversed']);

  for (const card of body.cards) {
    if (
      typeof card.name        !== 'string' || card.name.length        > 50  ||
      typeof card.meaning     !== 'string' || card.meaning.length     > 300 ||
      typeof card.position    !== 'string' || !VALID_POSITIONS.has(card.position)    ||
      typeof card.orientation !== 'string' || !VALID_ORIENTATIONS.has(card.orientation)
    ) {
      return jsonResponse({ error: 'Invalid card data' }, 400, cors);
    }
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
      return jsonResponse({ error: 'Reading unavailable' }, 502, cors);
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
