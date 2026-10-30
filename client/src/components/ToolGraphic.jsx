/**
 * Gráficos propios de cada herramienta (SVG, sin imágenes remotas).
 * lab   → inspección: líneas de texto, una afirmación bajo la lupa.
 * tutor → conversación progresiva: preguntas que suben de nivel.
 * diag  → evaluación: cinco segmentos, uno por pregunta.
 */
export default function ToolGraphic({ kind }) {
  if (kind === 'lab') {
    const lines = [300, 340, 220, 320, 260, 300, 180];
    return (
      <svg viewBox="0 0 420 300" className="tool-graphic tg-lab" aria-hidden="true">
        {lines.map((w, i) => (
          <rect key={i} x="30" y={34 + i * 34} width={w} height="8" rx="4" className={i === 3 ? 'tgl-line is-flag' : 'tgl-line'} style={{ '--i': i }} />
        ))}
        <rect x="22" y="126" width="336" height="26" rx="3" className="tgl-mark" />
        <g className="tgl-lens">
          <circle cx="300" cy="139" r="52" />
          <path d="M337 176 L384 223" />
        </g>
        <text x="30" y="282" className="tg-mono">afirmación 04 · marcada como falsa</text>
      </svg>
    );
  }
  if (kind === 'tutor') {
    const steps = ['¿Qué sabes ya?', 'Fíjate en…', 'Prueba con…', 'Un ejemplo parecido'];
    return (
      <svg viewBox="0 0 420 300" className="tool-graphic tg-tutor" aria-hidden="true">
        {steps.map((s, i) => (
          <g key={s} transform={`translate(${30 + i * 52} ${40 + i * 56})`} className="tgt-step" style={{ '--i': i }}>
            <rect width={190} height="38" rx="2" className="tgt-box" />
            <text x="14" y="24" className="tgt-text">
              {s}
            </text>
            <text x="-18" y="24" className="tg-mono">
              {i + 1}
            </text>
          </g>
        ))}
        <path d="M44 78 V96 H86 M96 134 V152 H138 M148 190 V208 H190" className="tgt-path" />
        <text x="30" y="282" className="tg-mono">la ayuda sube solo si te atascas</text>
      </svg>
    );
  }
  // diag
  const segs = [1, 1, 1, 0.5, 1];
  const cx = 210;
  const cy = 140;
  const r = 96;
  const arc = (i) => {
    const a0 = (-90 + i * 72 + 4) * (Math.PI / 180);
    const a1 = (-90 + (i + 1) * 72 - 4) * (Math.PI / 180);
    return `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  };
  return (
    <svg viewBox="0 0 420 300" className="tool-graphic tg-diag" aria-hidden="true">
      {segs.map((v, i) => (
        <path key={i} d={arc(i)} className={v < 1 ? 'tgd-seg is-gap' : 'tgd-seg'} style={{ '--i': i }} />
      ))}
      <text x={cx} y={cy + 6} textAnchor="middle" className="tgd-num">
        5
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" className="tg-mono">
        preguntas
      </text>
      <text x="30" y="282" className="tg-mono">qué dominas · qué repasar · dónde dudaste</text>
    </svg>
  );
}
