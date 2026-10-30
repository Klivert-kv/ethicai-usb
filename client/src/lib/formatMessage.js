/**
 * Convierte el texto del tutor (Markdown sencillo) en bloques de datos.
 * NO produce HTML: los componentes de React renderizan estos bloques como
 * texto, por lo que ningún contenido del modelo puede inyectar HTML ni scripts.
 *
 * Soporta: bloques ``` de código, listas (- * 1.), títulos (#) como texto
 * destacado, **negrita** y `código en línea`.
 */

export function parseInline(text) {
  const tokens = [];
  const re = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('`')) tokens.push({ type: 'code', value: raw.slice(1, -1) });
    else tokens.push({ type: 'bold', value: raw.slice(2, -2) });
    last = m.index + raw.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

export function parseMessage(text) {
  const blocks = [];
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', lines: paragraph.map(parseInline) });
      paragraph = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+#.-]*)\s*$/);
    if (fence) {
      flushParagraph();
      const code = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // salta el cierre (o el final si no se cerró)
      blocks.push({ type: 'code', lang: fence[1] || '', content: code.join('\n') });
      continue;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const ordered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (bullet || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const items = [];
      while (i < lines.length) {
        const b = lines[i].match(/^\s*[-*•]\s+(.*)$/);
        const o = lines[i].match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (isOrdered && o) items.push(parseInline(o[2]));
        else if (!isOrdered && b) items.push(parseInline(b[1]));
        else break;
        i += 1;
      }
      blocks.push({ type: 'list', ordered: isOrdered, items });
      continue;
    }

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', content: parseInline(heading[1]) });
      i += 1;
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
    i += 1;
  }
  flushParagraph();
  return blocks;
}
