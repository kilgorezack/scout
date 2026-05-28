// Tiny markdown renderer for the Gemini-generated briefings.
// Handles only what our system prompt produces:
//   ## headings, bulleted lists, **bold**, *italic*, inline links and
//   parenthetical (https://...) citations.

export default function BriefingMarkdown({ source }: { source: string }) {
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
  const parts: React.ReactNode[] = [];
  let i = 0;
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s)]+)/g;
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
