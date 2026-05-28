'use client';

import { useRef, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import BriefingMarkdown from '@/components/BriefingMarkdown';
import { parseZips } from '@/lib/utils';

type Status = 'idle' | 'streaming' | 'done' | 'error' | 'cached';

export default function ResearchForm() {
  const [competitorName, setCompetitorName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ownCompany, setOwnCompany] = useState('');
  const [zipsRaw, setZipsRaw] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const parsedZips = parseZips(zipsRaw);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competitorName.trim()) {
      setError('Enter a competitor name.');
      return;
    }
    setError(null);
    setText('');
    setStatus('streaming');

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitorName: competitorName.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          ownCompany: ownCompany.trim() || null,
          zips: parsedZips
        }),
        signal: ctrl.signal
      });
      if (!res.ok || !res.body) {
        const msg = await res.text();
        setError(msg || `HTTP ${res.status}`);
        setStatus('error');
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sawCached = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let eventName = 'message';
          let payload = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) payload += line.slice(5).trim();
          }
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload);
            if (eventName === 'cached') sawCached = true;
            else if (eventName === 'error' && obj.error) {
              setError(obj.error);
              setStatus('error');
            } else if (eventName === 'done') {
              setStatus(sawCached ? 'cached' : 'done');
            } else if (typeof obj.text === 'string') {
              setText((t) => t + obj.text);
            }
          } catch {
            // ignore malformed frames
          }
        }
      }
      setStatus((s) => (s === 'streaming' ? (sawCached ? 'cached' : 'done') : s));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    }
  }

  function resetAll() {
    abortRef.current?.abort();
    setText('');
    setStatus('idle');
    setError(null);
  }

  return (
    <div className="space-y-6">
      <form className="glass space-y-5 rounded-3xl p-7" onSubmit={onSubmit}>
        <label className="block">
          <span className="eyebrow">Competitor name <span className="text-red-500">*</span></span>
          <input
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            placeholder="e.g. Acme Broadband"
            className="mt-2 w-full rounded-2xl border border-ink-200 bg-white/60 px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Their website <span className="text-ink-400 normal-case tracking-normal">(optional)</span></span>
          <span className="mt-1 block text-sm text-ink-500">Helps ground the analysis if available.</span>
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://www.example.com"
            className="mt-2 w-full rounded-2xl border border-ink-200 bg-white/60 px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
          />
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Your company <span className="text-ink-400 normal-case tracking-normal">(optional)</span></span>
            <span className="mt-1 block text-sm text-ink-500">For &ldquo;vs. you&rdquo; framing.</span>
            <input
              value={ownCompany}
              onChange={(e) => setOwnCompany(e.target.value)}
              placeholder="Acme Fiber"
              className="mt-2 w-full rounded-2xl border border-ink-200 bg-white/60 px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
            />
          </label>

          <label className="block">
            <span className="eyebrow">Target ZIPs <span className="text-ink-400 normal-case tracking-normal">(optional)</span></span>
            <span className="mt-1 block text-sm text-ink-500">Comma- or space-separated.</span>
            <input
              value={zipsRaw}
              onChange={(e) => setZipsRaw(e.target.value)}
              placeholder="12345, 30303"
              className="mt-2 w-full rounded-2xl border border-ink-200 bg-white/60 px-4 py-3 font-mono text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-500/15"
            />
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Research failed</div>
              <div className="mt-1 text-xs">{error}</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-ink-500">Gemini 3 Flash · grounded with live Google search</span>
          <div className="flex items-center gap-2">
            {text && status !== 'streaming' && (
              <button type="button" onClick={resetAll} className="btn-ghost !text-[13px]">
                <RotateCw size={14} /> Clear
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={status === 'streaming' || !competitorName.trim()}>
              {status === 'streaming' ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Researching…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Run research
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {(text || status === 'streaming') && (
        <section className="panel p-7 sm:p-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
            <Sparkles size={12} />
            Briefing on {competitorName || '—'}
            {status === 'streaming' && (
              <span className="inline-flex items-center gap-1 text-ink-500">
                <Loader2 size={11} className="animate-spin" /> live
              </span>
            )}
            {status === 'cached' && (
              <span className="inline-flex items-center gap-1 text-ink-500">· cached</span>
            )}
          </div>
          <article className="prose prose-sm mt-4 max-w-none text-ink-800">
            <BriefingMarkdown source={text} />
            {status === 'streaming' && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-fuchsia-500 align-text-bottom" />
            )}
          </article>
          <p className="mt-6 border-t border-ink-100 pt-4 text-[11px] text-ink-500">
            Gemini-generated. Citations link to live sources. Treat as a starting point, verify before quoting.
          </p>
        </section>
      )}
    </div>
  );
}
