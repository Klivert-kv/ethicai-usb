/**
 * Recurso gráfico principal: el recorrido del pensamiento crítico.
 * Una "respuesta de IA" entra al sistema y pasa por pregunta, hipótesis,
 * fuente y verificación antes de convertirse en comprensión.
 * SVG propio, sin imágenes remotas. Las líneas se dibujan una sola vez al cargar.
 */
const NODES = [
  { id: 'ia', x: 70, y: 96, label: 'Respuesta de IA', kind: 'doubt', lx: -10, ly: -20, anchor: 'start' },
  { id: 'pregunta', x: 248, y: 58, label: 'Pregunta' },
  { id: 'hipotesis', x: 214, y: 214, label: 'Hipótesis', lx: -16, ly: 5, anchor: 'end' },
  { id: 'fuente', x: 390, y: 150, label: 'Fuente' },
  { id: 'verifica', x: 360, y: 318, label: 'Verifica', kind: 'key', lx: -18, ly: 5, anchor: 'end' },
  { id: 'comprende', x: 470, y: 436, label: 'Comprendes', kind: 'end', lx: 0, ly: 52, anchor: 'middle' },
  { id: 'copia', x: 96, y: 404, label: 'Copiar', kind: 'dead' },
];

const EDGES = [
  ['ia', 'pregunta'],
  ['ia', 'hipotesis'],
  ['pregunta', 'fuente'],
  ['hipotesis', 'fuente'],
  ['hipotesis', 'verifica'],
  ['fuente', 'verifica'],
  ['verifica', 'comprende'],
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

export default function ThinkingGraph() {
  return (
    <figure className="thinking-graph">
      <span className="tg-glyph" aria-hidden="true">
        ?
      </span>
      <svg
        viewBox="0 0 540 500"
        role="img"
        aria-label="Diagrama: una respuesta de IA pasa por pregunta, hipótesis, fuente y verificación antes de convertirse en comprensión. Copiarla directamente no lleva a comprender."
      >
        <defs>
          <pattern id="tg-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0H0V30" fill="none" className="tg-gridline" />
          </pattern>
        </defs>
        <rect width="540" height="500" fill="url(#tg-grid)" className="tg-grid" />

        {/* Atajo: copiar sin pensar no llega a ningún lado */}
        <path d={`M${byId.ia.x} ${byId.ia.y} C 40 250, 70 330, ${byId.copia.x} ${byId.copia.y}`} className="tg-edge tg-edge-dead" style={{ '--i': 0 }} />

        {EDGES.map(([a, b], i) => {
          const A = byId[a];
          const B = byId[b];
          const mx = (A.x + B.x) / 2;
          return (
            <path
              key={`${a}-${b}`}
              d={`M${A.x} ${A.y} C ${mx} ${A.y}, ${mx} ${B.y}, ${B.x} ${B.y}`}
              className={`tg-edge ${b === 'comprende' ? 'tg-edge-key' : ''}`}
              style={{ '--i': i + 1 }}
            />
          );
        })}

        {NODES.map((n, i) => (
          <g key={n.id} className={`tg-node tg-${n.kind || 'step'}`} style={{ '--i': i }} transform={`translate(${n.x} ${n.y})`}>
            <circle r={n.kind === 'end' ? 14 : n.kind === 'key' ? 10 : 7} className="tg-dot" />
            {n.kind === 'end' && <circle r="24" className="tg-halo" />}
            {n.kind === 'dead' && <path d="M-5 -5L5 5M5 -5L-5 5" className="tg-cross" />}
            <text x={n.lx ?? 16} y={n.ly ?? 5} textAnchor={n.anchor ?? 'start'} className="tg-label">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="tg-caption">
        <span>fig. 01</span> El camino corto no enseña.
      </figcaption>
    </figure>
  );
}
