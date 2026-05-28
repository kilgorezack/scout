// Deep-research client for the Scout briefing. Calls Gemini 3 Flash with
// Google Search grounding so the output is current, not bounded by the
// model's training cutoff. Streams Server-Sent Events back to the client.
//
// Required env: GEMINI_API_KEY  (free at https://aistudio.google.com/apikey)

import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3-flash';

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type DeepResearchInput = {
  competitorName: string;
  ownCompany: string | null;
  zips: string[];
  technologies?: string[]; // FCC tech labels we know the competitor uses
  recentHeadlines?: string[]; // competitor news titles + dates we already have
};

const SYSTEM_PROMPT = `You are a competitive intelligence analyst writing for executives at a US broadband / telecommunications service provider. Your job is to produce a tight, factual briefing on a single competitor in a specific footprint.

OUTPUT FORMAT — use exactly these section headings as level-2 Markdown (## ...):

## Snapshot
Two sentences. Who they are, their broadband footprint, and how they position themselves.

## Recent moves (last 12–18 months)
Bulleted list of concrete, dated events: product launches, network expansions, M&A, partnerships, executive changes, pricing changes, regulatory filings. Cite the source URL inline in parentheses after each bullet. Maximum 8 bullets. Skip anything you cannot ground in a real source.

## Strategic posture
One paragraph on where they're investing, where they're cutting back, and what their stated near-term priorities are. Reference earnings calls, investor decks, or press statements with inline URL citations.

## Strengths in this footprint
3–5 bullets. Concrete things they do well in the geography the user provided.

## Weaknesses & openings
3–5 bullets. Specific weaknesses or gaps the user can exploit — speed, sentiment, technology choice, pricing, service quality, gaps in coverage, brand issues. Each bullet must hint at a counter-move.

## Customer sentiment themes
2–4 bullets. Recurring themes from public reviews (Google, BBB, Reddit, regional forums). Quote a phrase if possible.

## Battlecard talking points
3–5 bullets in the format: "If they say [X], respond with [Y]." Practical, sales-ready language.

Rules:
- Be specific. Cite URLs inline in parentheses; do not invent sources.
- Markdown only. No code blocks, no tables.
- Do not mention the user's product names in the briefing — write it as neutral competitive intel.
- If you genuinely cannot find evidence for a section, write "No public signal found" and move on. Never speculate.
- Total length: under 700 words.`;

function buildUserPrompt(input: DeepResearchInput): string {
  const lines: string[] = [];
  lines.push(`Competitor to research: ${input.competitorName}`);
  if (input.ownCompany) lines.push(`Briefing requested by: ${input.ownCompany}`);
  if (input.zips.length) lines.push(`Target market (US ZIP codes): ${input.zips.join(', ')}`);
  if (input.technologies?.length) {
    lines.push(`Known broadband technologies for this competitor in the footprint: ${input.technologies.join(', ')}`);
  }
  if (input.recentHeadlines?.length) {
    lines.push(`Recent headlines Scout has already surfaced (you can confirm, extend, or contradict these):`);
    for (const h of input.recentHeadlines.slice(0, 8)) lines.push(`  - ${h}`);
  }
  lines.push('');
  lines.push('Generate the briefing now using live web research. Cite sources inline.');
  return lines.join('\n');
}

/**
 * Stream a deep-research briefing for one competitor. Yields incremental
 * text chunks; consumer is responsible for piping them to the client (we
 * use SSE in the route handler).
 */
export async function* streamDeepResearch(input: DeepResearchInput): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    yield 'Deep research is not configured. Set the GEMINI_API_KEY env var in Vercel and redeploy.';
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildUserPrompt(input);

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        // Live web grounding — required to get info beyond the training cutoff.
        tools: [{ googleSearch: {} }],
        temperature: 0.4
      }
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    yield `\n\n_Deep research failed: ${msg}_`;
  }
}
