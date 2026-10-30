import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';

export const PAGES = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'laboratorio', label: 'Atrapa la alucinación', short: 'Laboratorio' },
  { id: 'tutor', label: 'Tutor socrático', short: 'Tutor' },
  { id: 'diagnostico', label: 'Autodiagnóstico', short: 'Diagnóstico' },
];

export default function NavBar({ current, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menú móvil: Escape cierra y bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('menu-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('menu-open');
    };
  }, [open]);

  const go = (id) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="navbar-inner">
        <button className="brand" onClick={() => go('inicio')} aria-label="EthicAI USB, ir al inicio">
          <Logo />
        </button>

        <nav className="nav-desktop" aria-label="Secciones">
          <ul className="nav-tabs">
            {PAGES.map((p, i) => (
              <li key={p.id}>
                <button
                  className={`nav-tab ${current === p.id ? 'is-active' : ''}`}
                  aria-current={current === p.id ? 'page' : undefined}
                  aria-label={p.label}
                  onClick={() => go(p.id)}
                >
                  <span className="nav-num" aria-hidden="true">
                    0{i}
                  </span>
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? 'Cerrar' : 'Menú'}</span>
          <span className="menu-icon" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>

      <nav id="menu-movil" className="nav-mobile" aria-label="Menú" hidden={!open}>
        <ul>
          {PAGES.map((p, i) => (
            <li key={p.id} style={{ '--i': i }}>
              <button
                className={`nav-mobile-link ${current === p.id ? 'is-active' : ''}`}
                aria-current={current === p.id ? 'page' : undefined}
                onClick={() => go(p.id)}
              >
                <span className="nav-num" aria-hidden="true">
                  0{i}
                </span>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="nav-mobile-note">Pensar mejor en la era de la inteligencia artificial.</p>
      </nav>
    </header>
  );
}
