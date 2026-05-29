// Structured plan/pricing research for a single competitor. Unlike the
// narrative deep-research briefing, this returns a compact JSON record so the
// Analyze report can render a side-by-side comparison table.
//
// IMPORTANT: pricing, data caps, contract terms and real speed tiers are NOT
// in the FCC BDC dataset. We get them from live web research (Gemini + Google
// Search grounding) and always return source URLs so the figures are
// auditable — never fabricated. Unknown fields come back as "Unknown".
//
// Required env: GEMINI_API_KEY

import { GoogleGenAI } from '@google/genai';
import { getSupabase } from './supabase';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const CACHE_TTL_DAYS = 7;

export function plansConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type PlanSource = { title: string; url: string };

export type CompetitorPlans = {
  providerName: string;
  speedTiers: string; // e.g. "300 Mbps – 5 Gbps"
  priceRange: string; // e.g. "$50–$90/mo"
  dataCap: string; // e.g. "Unlimited" or "1.2 TB"
  contractRequired: 'Yes' | 'No' | 'Unknown';
  equipmentFee: string; // e.g. "$15/mo gateway" or "Included"
  notes: string; // promo structure, bundles, caveats — one short line
  confidence: 'high' | 'medium' | 'low';
  sources: PlanSource[];
  researchedAt: string;
};

export type PlansInput = {
  providerName: string;
  technologies?: string[];
  zips?: string[];
};

function cacheKey(input: PlansInput): string {
  return [input.providerName.trim().toLowerCase(), [...(input.zips ?? [])].sort().join(',')].join('|');
}

const SYSTEM_PROMPT = `You are a telecom pricing analyst. For ONE named US broadband provider, research their CURRENT residential internet plans using live web search (their own site is the primary source; back it with trade press if needed).

Return ONLY a single JSON object — no prose, no markdown, no code fences — with exactly these keys:
{
  "speedTiers": string,        // download speed range across their residential tiers, e.g. "300 Mbps – 5 Gbps". If one tier, state it.
  "priceRange": string,        // monthly price range for those tiers, e.g. "$50–$90/mo". Note if promo vs. standard.
  "dataCap": string,           // "Unlimited", or the cap e.g. "1.2 TB/mo", or "Unknown"
  "contractRequired": string,  // exactly "Yes", "No", or "Unknown"
  "equipmentFee": string,      // e.g. "Included", "$15/mo gateway", or "Unknown"
  "notes": string,             // ONE short line: promo structure, bundle discounts, or key caveat. Empty string if none.
  "confidence": string,        // "high" | "medium" | "low" — your confidence the figures are current and for THIS market
  "sources": [ { "title": string, "url": string } ]  // 1–4 real, working URLs you actually used
}

HARD RULES
- Use only figures you can support with a real source URL. Put those URLs in "sources".
- If you cannot find a value, use "Unknown" (or "" for notes). NEVER guess or invent a number.
- Prefer the provider's official plans/pricing page for the given market. If pricing varies by region and you can't confirm the target market, lower "confidence" and say so in "notes".
- Output must be valid JSON and nothing else.`;

function buildUserPrompt(input: PlansInput): string {
  const lines = [`Provider: ${input.providerName}`];
  if (input.technologies?.length) lines.push(`Known access technologies: ${input.technologies.join(', ')}`);
  if (input.zips?.length) lines.push(`Target market (US ZIP codes): ${input.zips.join(', ')}`);
  lines.push('Research their current residential plans for this market and return the JSON object now.');
  return lines.join('\n');
}

// Pull the first balanced {...} JSON object out of a model response that may
// include stray text or code fences.
function extractJson(text: string): unknown | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function coerce(raw: unknown, providerName: string): CompetitorPlans {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback = 'Unknown') =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const contract = str(o.contractRequired);
  const contractRequired: CompetitorPlans['contractRequired'] =
    /^yes$/i.test(contract) ? 'Yes' : /^no$/i.test(contract) ? 'No' : 'Unknown';
  const conf = str(o.confidence, 'low').toLowerCase();
  const confidence: CompetitorPlans['confidence'] =
    conf === 'high' ? 'high' : conf === 'medium' ? 'medium' : 'low';
  const sources: PlanSource[] = Array.isArray(o.sources)
    ? (o.sources as unknown[])
        .map((s) => {
          const so = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
          return { title: str(so.title, 'Source'), url: str(so.url, '') };
        })
        .filter((s) => /^https?:\/\//i.test(s.url))
        .slice(0, 4)
    : [];
  return {
    providerName,
    speedTiers: str(o.speedTiers),
    priceRange: str(o.priceRange),
    dataCap: str(o.dataCap),
    contractRequired,
    equipmentFee: str(o.equipmentFee),
    notes: str(o.notes, ''),
    confidence,
    sources,
    researchedAt: new Date().toISOString()
  };
}

async function readCached(key: string): Promise<CompetitorPlans | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from('competitor_plans')
    .select('plans, created_at')
    .eq('cache_key', key)
    .maybeSingle();
  if (!data) return null;
  const ageMs = Date.now() - new Date(data.created_at as string).getTime();
  if (ageMs > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) return null;
  return data.plans as CompetitorPlans;
}

async function writeCached(key: string, plans: CompetitorPlans, input: PlansInput): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from('competitor_plans')
    .upsert({
      cache_key: key,
      provider_name: input.providerName,
      zips: input.zips ?? [],
      plans,
      created_at: new Date().toISOString()
    })
    .then(() => undefined, () => undefined);
}

export async function researchCompetitorPlans(input: PlansInput): Promise<CompetitorPlans> {
  const key = cacheKey(input);
  const cached = await readCached(key);
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }],
      temperature: 0.2
    }
  });

  const parsed = extractJson(res.text ?? '');
  const plans = coerce(parsed, input.providerName);
  // Only cache if we actually got something useful (at least one source or a
  // concrete price/speed), so a transient empty result isn't pinned for 7 days.
  if (plans.sources.length > 0 || plans.priceRange !== 'Unknown' || plans.speedTiers !== 'Unknown') {
    await writeCached(key, plans, input);
  }
  return plans;
}
