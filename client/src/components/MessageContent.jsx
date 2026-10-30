import { useMemo, useState } from 'react';
import { parseMessage } from '../lib/formatMessage.js';

function Inline({ tokens }) {
  return tokens.map((t, i) => {
    if (t.type === 'bold') return <strong key={i}>{t.value}</strong>;
    if (t.type === 'code') return <code key={i} className="inline-code">{t.value}</code>;
    return <span key={i}>{t.value}</span>;
  });
}

function CodeBlock({ lang, content }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* portapapeles no disponible */
    }
  };
  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{lang || 'código'}</span>
        <button type="button" onClick={copy} className="link-btn">
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {/* Solo se muestra como texto: el código del modelo nunca se ejecuta. */}
      <pre>
        <code>{content}</code>
      </pre>
    </div>
  );
}

/** Renderiza la respuesta del tutor sin usar HTML crudo (sin dangerouslySetInnerHTML). */
export default function MessageContent({ text }) {
  const blocks = useMemo(() => parseMessage(text), [text]);
  return (
    <div className="message-content">
      {blocks.map((b, i) => {
        if (b.type === 'code') return <CodeBlock key={i} lang={b.lang} content={b.content} />;
        if (b.type === 'heading')
          return (
            <p key={i} className="msg-heading">
              <Inline tokens={b.content} />
            </p>
          );
        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <Inline tokens={item} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i}>
            {b.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <Inline tokens={line} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
