import { useCountUp } from '../hooks/useCountUp.js';

/** Indicador circular de puntaje (0–100) que se llena y cuenta al aparecer. */
export default function ScoreBadge({ value, size = 96, label }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const shown = useCountUp(v);
  const tone = v >= 67 ? 'good' : v >= 34 ? 'mid' : 'low';
  return (
    <div
      className={`score-badge tone-${tone}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label || `${v} de 100`}
      data-value={v}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="score-track" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="score-value"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="score-number" aria-hidden="true">
        {shown}
      </span>
    </div>
  );
}
