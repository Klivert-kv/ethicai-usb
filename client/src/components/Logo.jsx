/** Marca propia del prototipo (no es un logotipo institucional). */
export default function Logo({ compact = false }) {
  return (
    <span className="logo">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--surface-2)" />
        <circle cx="16" cy="16" r="9" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <path d="M16 11v6m0 4v.5" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="logo-text">
          EthicAI <span className="logo-usb">USB</span>
        </span>
      )}
    </span>
  );
}
