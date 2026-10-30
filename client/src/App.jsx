import { useEffect, useState } from 'react';
import NavBar, { PAGES } from './components/NavBar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Laboratorio from './pages/Laboratorio.jsx';
import Tutor from './pages/Tutor.jsx';
import Diagnostico from './pages/Diagnostico.jsx';
import { useScrollReveal } from './hooks/useScrollReveal.js';

const VALID = new Set(PAGES.map((p) => p.id));
const fromHash = () => {
  const h = window.location.hash.replace('#', '');
  return VALID.has(h) ? h : 'inicio';
};

export default function App() {
  const [page, setPage] = useState(fromHash);
  useScrollReveal();

  useEffect(() => {
    const onHash = () => setPage(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const titles = {
      inicio: 'EthicAI USB — Pensar mejor en la era de la IA',
      laboratorio: 'Atrapa la alucinación · EthicAI USB',
      tutor: 'Tutor socrático · EthicAI USB',
      diagnostico: 'Autodiagnóstico · EthicAI USB',
    };
    document.title = titles[page];
  }, [page]);

  const navigate = (id) => {
    if (window.location.hash !== `#${id}`) window.location.hash = id;
    setPage(id);
    window.scrollTo({ top: 0 });
  };

  // Todas las pantallas quedan montadas y solo se ocultan: así no se pierde el
  // estado de la sesión (retos, cuestionario, conversación) al cambiar de pestaña.
  return (
    <>
      <a
        href="#contenido"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault(); // no cambia el hash de navegación
          document.getElementById('contenido')?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <NavBar current={page} onNavigate={navigate} />
      <main id="contenido" className={`main main-${page}`} tabIndex={-1}>
        <div hidden={page !== 'inicio'}>
          <Home onNavigate={navigate} active={page === 'inicio'} />
        </div>
        <div hidden={page !== 'laboratorio'} className="container">
          <Laboratorio />
        </div>
        <div hidden={page !== 'tutor'} className="container">
          <Tutor active={page === 'tutor'} />
        </div>
        <div hidden={page !== 'diagnostico'} className="container">
          <Diagnostico />
        </div>
      </main>
      <Footer onNavigate={navigate} />
    </>
  );
}
