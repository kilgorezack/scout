// Signal AI Insights — Next.js port of signal-src/api/insights.js.
//
// Takes the same POST { properties } body as Signal's original Vercel
// function and streams a Gemini market analysis back as Server-Sent
// Events. Reuses the four prompt builders (au / uk / ca / za, x2 for
// residential vs business) defined in signal-src/api/insights.js by
// importing them directly — we just adapt the streaming surface to a
// Web Response.

import { GoogleGenerativeAI } from '@google/generative-ai';

// Import the prompt builders directly from Signal's vendored API file.
// signal-src/api/insights.d.ts declares the surface so this typechecks
// without enabling allowJs project-wide.
import {
  buildPrompt,
  buildBusinessPrompt,
  buildCaPrompt,
  buildCaBizPrompt,
  buildZaPrompt,
  buildZaBizPrompt
} from '@/signal-src/api/insights';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let body: { properties?: Record<string, unknown> };
  try {
    body = (await req.json()) as { properties?: Record<string, unknown> };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const properties = body?.properties;
  if (!properties) {
    return Response.json({ error: 'Missing properties field' }, { status: 400 });
  }

  const isBusiness = (properties as Record<string, unknown>).smartbiz_score != null;
  const market = (properties as Record<string, unknown>).market;
  let prompt: string;
  if (market === 'ca') {
    prompt = isBusiness ? buildCaBizPrompt(properties) : buildCaPrompt(properties);
  } else if (market === 'za') {
    prompt = isBusiness ? buildZaBizPrompt(properties) : buildZaPrompt(properties);
  } else {
    prompt = isBusiness ? buildBusinessPrompt(properties) : buildPrompt(properties);
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.7
          }
        });
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
          }
        }
        controller.enqueue(enc.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
