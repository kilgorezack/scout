import * as cheerio from 'cheerio';

export type CategoryScore = {
  id: string;
  label: string;
  score: number;
  max: number;
  details: string[];
  suggestions: string[];
};

export type AIReadinessReport = {
  url: string;
  fetchedAt: string;
  totalScore: number;
  maxScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: CategoryScore[];
  fatalError?: string;
};

function gradeFor(pct: number): AIReadinessReport['grade'] {
  if (pct >= 90) return 'A';
  if (pct >= 75) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function normalizeUrl(input: string): string {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot', 'anthropic-ai'];

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': 'ScoutBot/1.0 (+broadband AI readiness check)', ...(init?.headers ?? {}) },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000)
    });
    return res;
  } catch {
    return null;
  }
}

export async function scoreAIReadiness(rawUrl: string): Promise<AIReadinessReport> {
  const url = normalizeUrl(rawUrl);
  const pageRes = await safeFetch(url);
  if (!pageRes || !pageRes.ok) {
    return {
      url,
      fetchedAt: new Date().toISOString(),
      totalScore: 0,
      maxScore: 100,
      grade: 'F',
      categories: [],
      fatalError: pageRes ? `Site returned HTTP ${pageRes.status}` : 'Could not reach the URL.'
    };
  }
  const html = await pageRes.text();
  const $ = cheerio.load(html);
  const origin = new URL(pageRes.url).origin;
  const isHttps = pageRes.url.startsWith('https://');

  const [robotsRes, llmsRes, sitemapRes] = await Promise.all([
    safeFetch(`${origin}/robots.txt`),
    safeFetch(`${origin}/llms.txt`),
    safeFetch(`${origin}/sitemap.xml`)
  ]);
  const robotsTxt = robotsRes && robotsRes.ok ? await robotsRes.text() : '';
  const hasLlmsTxt = Boolean(llmsRes && llmsRes.ok);
  const hasSitemap = Boolean(sitemapRes && sitemapRes.ok);

  const categories: CategoryScore[] = [];

  // 1. Crawler policy (20)
  {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    if (robotsTxt) {
      details.push('robots.txt is reachable.');
      score += 4;
      const blocksAny = AI_BOTS.some((b) => new RegExp(`User-agent:\\s*${b}[\\s\\S]*?Disallow:\\s*/`, 'i').test(robotsTxt));
      if (!blocksAny) {
        details.push('AI bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are not blocked.');
        score += 8;
      } else {
        suggestions.push('Unblock at least one major AI crawler so assistants can cite you.');
      }
      if (/Sitemap:\s*https?:\/\//i.test(robotsTxt)) {
        details.push('robots.txt declares a Sitemap.');
        score += 2;
      } else {
        suggestions.push('Add a `Sitemap:` directive to robots.txt.');
      }
    } else {
      suggestions.push('Publish a robots.txt at the site root.');
    }
    if (hasLlmsTxt) {
      details.push('llms.txt is published.');
      score += 6;
    } else {
      suggestions.push('Publish an `llms.txt` summarizing your services, coverage area, and key facts for LLMs.');
    }
    categories.push({ id: 'crawlers', label: 'Crawler policy', score: Math.min(score, 20), max: 20, details, suggestions });
  }

  // 2. Structured data (20)
  {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const ldBlocks = $('script[type="application/ld+json"]')
      .toArray()
      .map((el) => $(el).contents().text());
    const types = new Set<string>();
    for (const raw of ldBlocks) {
      try {
        const parsed = JSON.parse(raw);
        const visit = (node: unknown) => {
          if (Array.isArray(node)) return node.forEach(visit);
          if (node && typeof node === 'object') {
            const t = (node as Record<string, unknown>)['@type'];
            if (typeof t === 'string') types.add(t);
            if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x));
            Object.values(node as Record<string, unknown>).forEach(visit);
          }
        };
        visit(parsed);
      } catch {
        // ignore invalid JSON-LD
      }
    }
    const wants = [
      ['Organization', 5],
      ['LocalBusiness', 4],
      ['Service', 4],
      ['FAQPage', 4],
      ['BreadcrumbList', 3]
    ] as const;
    for (const [t, pts] of wants) {
      if (types.has(t)) {
        details.push(`JSON-LD ${t} present.`);
        score += pts;
      } else {
        suggestions.push(`Add JSON-LD ${t} schema.`);
      }
    }
    categories.push({ id: 'schema', label: 'Structured data', score: Math.min(score, 20), max: 20, details, suggestions });
  }

  // 3. Metadata quality (15)
  {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content')?.trim();
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim();
    const twitter = $('meta[name="twitter:card"]').attr('content')?.trim();
    const canonical = $('link[rel="canonical"]').attr('href')?.trim();

    if (title && title.length >= 15 && title.length <= 70) {
      details.push(`<title> is well-sized (${title.length} chars).`);
      score += 4;
    } else {
      suggestions.push('Use a descriptive `<title>` between 15 and 70 characters.');
    }
    if (description && description.length >= 60 && description.length <= 200) {
      details.push('Meta description is well-sized.');
      score += 3;
    } else {
      suggestions.push('Write a 60–200 character meta description.');
    }
    if (ogTitle && ogImage) {
      details.push('Open Graph title + image set.');
      score += 3;
    } else {
      suggestions.push('Set Open Graph `og:title` and `og:image` tags.');
    }
    if (twitter) {
      details.push('Twitter card declared.');
      score += 2;
    } else {
      suggestions.push('Add a `twitter:card` meta tag.');
    }
    if (canonical) {
      details.push('Canonical URL set.');
      score += 3;
    } else {
      suggestions.push('Add a `<link rel="canonical">` tag.');
    }
    categories.push({ id: 'metadata', label: 'Metadata quality', score: Math.min(score, 15), max: 15, details, suggestions });
  }

  // 4. Content depth (15)
  {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    if (words >= 800) { details.push(`Landing copy is substantive (${words} words).`); score += 5; }
    else if (words >= 300) { details.push(`Landing copy is light (${words} words).`); score += 2; }
    else { suggestions.push('Expand homepage copy to at least 300 words of indexable text.'); }

    const h1 = $('h1').length;
    const h2 = $('h2').length;
    if (h1 === 1 && h2 >= 2) { details.push('Heading hierarchy is clean (1 H1, multiple H2s).'); score += 4; }
    else { suggestions.push('Use exactly one `<h1>` and a meaningful set of `<h2>` sections.'); }

    const faqHints = /\bFAQ\b|frequently asked|how do i|what is|do you offer/i.test(bodyText);
    if (faqHints) { details.push('Page surfaces FAQ-style content.'); score += 3; }
    else { suggestions.push('Add an FAQ section answering the top questions subscribers ask.'); }

    const serviceWords = (bodyText.match(/\b(fiber|gigabit|internet|broadband|tv|mobile|streaming|wifi)\b/gi) ?? []).length;
    if (serviceWords >= 8) { details.push('Page clearly describes services.'); score += 3; }
    else { suggestions.push('Make service offerings explicit on the homepage (fiber, gigabit, WiFi, etc.).'); }

    categories.push({ id: 'content', label: 'Content depth', score: Math.min(score, 15), max: 15, details, suggestions });
  }

  // 5. NAP & coverage (15)
  {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    const text = $('body').text();
    const hasPhone = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text);
    const hasAddress = /\b\d{1,6}\s+[A-Za-z][A-Za-z\s]{2,}\s+(Street|St|Avenue|Ave|Road|Rd|Blvd|Boulevard|Drive|Dr|Lane|Ln|Way|Court|Ct)\b/i.test(text);
    const hasZip = /\b\d{5}(?:-\d{4})?\b/.test(text);
    const hasCoverageWord = /\b(coverage|service area|availability|where we serve|check availability|enter your address|zip code)\b/i.test(text);

    if (hasPhone) { details.push('Phone number on page.'); score += 4; } else { suggestions.push('Add a contact phone number to the homepage.'); }
    if (hasAddress) { details.push('Physical address detected.'); score += 3; } else { suggestions.push('Include a physical address in the footer.'); }
    if (hasZip) { details.push('ZIP-style identifier present.'); score += 2; }
    if (hasCoverageWord) { details.push('Service-area / availability language found.'); score += 6; } else { suggestions.push('Add an address-availability check or clear service area description.'); }
    categories.push({ id: 'nap', label: 'Name, address & coverage', score: Math.min(score, 15), max: 15, details, suggestions });
  }

  // 6. Performance / SEO basics (15)
  {
    const details: string[] = [];
    const suggestions: string[] = [];
    let score = 0;
    if (isHttps) { details.push('Site served over HTTPS.'); score += 4; } else { suggestions.push('Serve the site over HTTPS.'); }
    if (hasSitemap) { details.push('sitemap.xml is reachable.'); score += 4; } else { suggestions.push('Publish a sitemap.xml.'); }
    const viewport = $('meta[name="viewport"]').attr('content');
    if (viewport && /width=device-width/i.test(viewport)) { details.push('Mobile viewport set.'); score += 3; }
    else { suggestions.push('Add `<meta name="viewport" content="width=device-width, initial-scale=1">`.'); }
    const lang = $('html').attr('lang');
    if (lang) { details.push('`<html lang>` is set.'); score += 2; } else { suggestions.push('Set an `lang` attribute on `<html>`.'); }
    const preloads = $('link[rel="preload"]').length;
    if (preloads > 0) { details.push('Critical resources use `<link rel="preload">`.'); score += 2; }
    categories.push({ id: 'perf', label: 'Performance & SEO basics', score: Math.min(score, 15), max: 15, details, suggestions });
  }

  const totalScore = categories.reduce((s, c) => s + c.score, 0);
  const maxScore = categories.reduce((s, c) => s + c.max, 0);
  const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  return {
    url,
    fetchedAt: new Date().toISOString(),
    totalScore,
    maxScore,
    grade: gradeFor(pct),
    categories
  };
}
