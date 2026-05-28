'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  competitorName: string;
  ownCompany: string | null;
  zips: string[];
  technologies?: string[];
  recentHeadlines?: string[];
};

export default function DeepResearchDrawer({
  open,
  onClose,
  competitorName,
  ownCompany,
  zips,
  technologies,
  recentHeadlines
}: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error' | 'cached'>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedKey = useRef<string | null>(null);

  // Reset + kick off whenever the drawer opens for a new competitor.
  useEffect(() => {
    if (!open) return;
    const key = `${competitorName}|${zips.join(',')}|${ownCompany ?? ''}`;
    if (startedKey.current === key) return;
    startedKey.current = key;

    setText('');
    setError(null);
    setStatus('streaming');

    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch('/api/deep-research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitorName, ownCompany, zips, technologies, recentHeadlines }),
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
            let dataPayload = '';
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('data:')) dataPayload += line.slice(5).trim();
            }
            if (!dataPayload) continue;
            try {
              const obj = JSON.parse(dataPayload);
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
        if (status !== 'error') setStatus((s) => (s === 'streaming' ? (sawCached ? 'cached' : 'done') : s));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError(e instanceof Error ? e.message : String(e));
          setStatus('error');
        }
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, competitorName, zips.join(','), ownCompany]);

  // Reset the "started" sentinel when the drawer closes so re-opening
  // re-runs the request (from cache it'll be instant).
  useEffect(() => {
    if (!open) startedKey.current = null;
  }, [open]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm transition"
      />
      {/* Drawer */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
              <Sparkles size={12} />
              Deep research
              {status === 'streaming' && (
                <span className="inline-flex items-center gap-1 text-ink-500">
                  <Loader2 size={11} className="animate-spin" />
                  live
                </span>
              )}
              {status === 'cached' && (
                <span className="inline-flex items-center gap-1 text-ink-500">· cached</span>
              )}
            </div>
            <h2 className="display mt-1 text-2xl text-ink-900">{competitorName}</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Researched against {zips.length} ZIP{zips.length === 1 ? '' : 's'} · grounded with live Google search
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Deep research failed</div>
                <div className="mt-1 text-xs">{error}</div>
              </div>
            </div>
          )}
          {!text && !error && status === 'streaming' && (
            <p className="animate-pulse text-sm text-ink-500">Researching the public record…</p>
          )}
          {text && (
            <article className="prose prose-sm max-w-none text-ink-800">
              <MarkdownLite source={text} />
              {status === 'streaming' && (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-fuchsia-500 align-text-bottom" />
              )}
            </article>
          )}
        </div>

        <footer className="border-t border-ink-100 px-6 py-3 text-[11px] text-ink-500">
          Gemini-generated. Citations link to live sources. Treat as a starting point, verify before quoting.
        </footer>
      </aside>
    </div>
  );
}

/**
 * Tiny markdown renderer — handles only what the Gemini prompt produces:
 * ## headings, bullet lists, **bold**, *italic*, and inline links/URLs.
 * We intentionally avoid pulling a full markdown library.
 */
function MarkdownLite({ source }: { source: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = source.split(/\r?\n/);
  let listBuf: string[] = [];

  const flushList = (key: number) => {
    if (listBuf.length === 0) return;
    blocks.push(
      <ul key={`l${key}`} className="my-3 list-disc space-y-1.5 pl-5">
        {listBuf.map((l, i) => (
          <li key={i} className="text-[15px] leading-relaxed text-ink-800">
            <Inline text={l} />
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith('## ')) {
      flushList(i);
      blocks.push(
        <h3 key={i} className="display mt-6 text-lg font-semibold text-ink-900">
          {line.slice(3)}
        </h3>
      );
    } else if (/^[-*]\s+/.test(line)) {
      listBuf.push(line.replace(/^[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flushList(i);
    } else {
      flushList(i);
      blocks.push(
        <p key={i} className="mt-2 text-[15px] leading-relaxed text-ink-800">
          <Inline text={line} />
        </p>
      );
    }
  });
  flushList(-1);
  return <>{blocks}</>;
}

function Inline({ text }: { text: string }) {
  // Convert bare URLs and (https://...) parenthetical citations into links,
  // plus **bold** / *italic*.
  const parts: React.ReactNode[] = [];
  let i = 0;
  const re =
    /(\*\*[^*]+\*\*|\*[^*]+\*|\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s)]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('(') && m[2]) {
      parts.push(' (');
      parts.push(
        <a
          key={key++}
          href={m[2]}
          target="_blank"
          rel="noreferrer"
          className="text-accent-600 underline decoration-accent-300 underline-offset-2 hover:text-accent-700"
        >
          source
        </a>
      );
      parts.push(')');
    } else {
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noreferrer"
          className="text-accent-600 underline decoration-accent-300 underline-offset-2 hover:text-accent-700"
        >
          {token.replace(/^https?:\/\//, '')}
        </a>
      );
    }
    i = m.index + token.length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts}</>;
}
