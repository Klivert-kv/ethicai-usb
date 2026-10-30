import Logo from './Logo.jsx';
import { PAGES } from './NavBar.jsx';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo />
          <p className="footer-claim">Pensar mejor en la era de la inteligencia artificial.</p>
        </div>

        <nav aria-label="Navegación del pie de página">
          <p className="label">Herramientas</p>
          <ul className="footer-links">
            {PAGES.filter((p) => p.id !== 'inicio').map((p) => (
              <li key={p.id}>
                <button className="footer-link" onClick={() => onNavigate(p.id)}>
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label">Proyecto</p>
          <p className="footer-text">
            Proyecto Final de Diseño · Facultad de Ingenierías y Ciencias Básicas, Universidad Simón Bolívar.
          </p>
          <p className="footer-text">Klivert Chiquiza, Nilson Hernández, Manuel Pinilla.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Prototipo académico (MVP). No es una plataforma oficial de la universidad.</p>
        <p>No guarda conversaciones ni resultados.</p>
      </div>
    </footer>
  );
}
