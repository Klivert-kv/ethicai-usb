import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import ThinkingGraph from '../components/ThinkingGraph.jsx';
import ToolGraphic from '../components/ToolGraphic.jsx';
import { getTutorStatus } from '../services/api.js';

const HERO_LINES = [
  [{ t: 'La' }, { t: 'IA' }],
  [{ t: 'responde.' }],
  [{ t: 'Tú' }, { t: 'aprendes' }],
  [{ t: 'a' }, { t: 'pensar.', accent: true }],
];

const PRINCIPIOS = [
  { n: '01', t: 'Pregunta antes de pedir respuestas.' },
  { n: '02', t: 'Verifica antes de creer.' },
  { n: '03', t: 'Mide lo que sabes antes del examen.' },
];

const HERRAMIENTAS = [
  {
    id: 'laboratorio',
    n: '01',
    verbo: 'Verificar',
    titulo: 'Atrapa la alucinación',
    texto:
      'Tres respuestas que parecen escritas por una IA esconden datos falsos, conclusiones arrastradas y fuentes inventadas. Encuéntralos antes de copiarlos.',
    meta: [
      ['Formato', '3 retos'],
      ['Duración', '≈ 2 min'],
      ['Requiere IA', 'No'],
    ],
    cta: 'Abrir el laboratorio',
    graphic: 'lab',
  },
  {
    id: 'tutor',
    n: '02',
    verbo: 'Preguntar',
    titulo: 'Tutor socrático',
    texto:
      'Explica conceptos y corrige errores, pero no te hace la tarea. Te guía con preguntas y pistas que solo suben de nivel cuando te atascas.',
    meta: [
      ['Formato', 'Conversación'],
      ['Ayuda', '4 niveles de pista'],
      ['Requiere IA', 'Sí · gpt-oss'],
    ],
    cta: 'Hablar con el tutor',
    graphic: 'tutor',
  },
  {
    id: 'diagnostico',
    n: '03',
    verbo: 'Medir',
    titulo: 'Autodiagnóstico',
    texto:
      'Un simulacro corto antes del parcial: qué temas dominas, cuáles repasar y en qué preguntas estabas seguro… pero equivocado.',
    meta: [
      ['Formato', '5 preguntas'],
      ['Duración', '≈ 3 min'],
      ['Requiere IA', 'No'],
    ],
    cta: 'Empezar el diagnóstico',
    graphic: 'diag',
  },
];

function ToolStatus({ id, tutorStatus }) {
  if (id !== 'tutor') {
    return (
      <span className="status-line tone-ok">
        <span className="status-dot" aria-hidden="true" /> Disponible · funciona sin conexión
      </span>
    );
  }
  if (!tutorStatus) {
    return (
      <span className="status-line">
        <span className="status-dot" aria-hidden="true" /> Comprobando conexión con el modelo…
      </span>
    );
  }
  const ok = tutorStatus.server && tutorStatus.reachable && tutorStatus.modelAvailable;
  return (
    <span className={`status-line ${ok ? 'tone-ok' : 'tone-bad'}`}>
      <span className="status-dot" aria-hidden="true" />
      {ok ? `Conectado a ${tutorStatus.model}` : 'Sin conexión con Ollama en este momento'}
    </span>
  );
}

export default function Home({ onNavigate, active }) {
  const [tutorStatus, setTutorStatus] = useState(null);

  useEffect(() => {
    if (active) getTutorStatus().then(setTutorStatus);
  }, [active]);

  const scrollToTools = () => {
    document.getElementById('herramientas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let wordIndex = 0;
  return (
    <div className="home">
      {/* ---------- HERO ---------- */}
      <section className="hero container">
        <div className="hero-main">
          <p className="label hero-kicker">
            <span className="kicker-bar" aria-hidden="true" /> Pensar mejor en la era de la IA
          </p>
          <h1 className="hero-title" aria-label="La IA responde. Tú aprendes a pensar.">
            {HERO_LINES.map((line, li) => (
              <span className="hero-line" key={li} aria-hidden="true">
                {line.map((w) => {
                  const i = wordIndex++;
                  return (
                    <span className="word" key={w.t}>
                      <span className={w.accent ? 'word-inner serif-accent' : 'word-inner'} style={{ '--i': i }}>
                        {w.t}
                      </span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>
          <div className="hero-copy">
            <p className="hero-lead">
              EthicAI USB entrena a estudiantes universitarios para usar la inteligencia artificial como apoyo y no como
              sustituto: <em>preguntar</em>, <em>verificar</em> y <em>medir</em> lo que de verdad entienden.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate('laboratorio')}>
                Empezar a aprender <Icon name="arrow" size={18} />
              </button>
              <button className="btn btn-quiet btn-lg" onClick={scrollToTools}>
                Explorar las herramientas
              </button>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <ThinkingGraph />
        </div>

        <ol className="hero-index" aria-label="Herramientas">
          {HERRAMIENTAS.map((h) => (
            <li key={h.id}>
              <button onClick={() => onNavigate(h.id)} className="hero-index-link">
                <span className="mono">{h.n}</span> {h.verbo}
                <span className="muted"> — {h.titulo}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- MANIFIESTO ---------- */}
      <section className="section container manifesto" aria-labelledby="manifesto-title">
        <p className="label section-label" data-reveal>
          Por qué existe
        </p>
        <div className="manifesto-body">
          <h2 id="manifesto-title" className="display-m" data-reveal>
            La IA no es el problema.
            <br />
            <span className="serif-accent">Copiar sin entender, sí.</span>
          </h2>
          <p className="manifesto-copy" data-reveal style={{ '--d': 1 }}>
            Sacas 4.5 en el taller y 2.0 en el parcial presencial. No porque la IA sea mala, sino porque nadie te enseñó a
            usarla para aprender. EthicAI USB no vigila ni castiga: enseña.
          </p>
          <ol className="principles">
            {PRINCIPIOS.map((p, i) => (
              <li key={p.n} data-reveal style={{ '--d': i + 1 }}>
                <span className="mono principle-n">{p.n}</span>
                <span className="principle-t">{p.t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- HERRAMIENTAS ---------- */}
      <section id="herramientas" className="section tools" aria-labelledby="tools-title">
        <div className="container tools-head">
          <p className="label section-label" data-reveal>
            Herramientas
          </p>
          <h2 id="tools-title" className="display-m" data-reveal>
            Tres formas de usar la IA
            <br />
            <span className="serif-accent">sin dejar de pensar.</span>
          </h2>
        </div>

        {HERRAMIENTAS.map((h, i) => (
          <article key={h.id} className={`tool-block tool-${h.graphic} ${i % 2 ? 'is-reversed' : ''}`} aria-labelledby={`tool-${h.id}`}>
            <div className="container tool-grid">
              <div className="tool-info" data-reveal>
                <p className="tool-kicker">
                  <span className="tool-n" aria-hidden="true">
                    {h.n}
                  </span>
                  <span className="label">{h.verbo}</span>
                </p>
                <h3 id={`tool-${h.id}`} className="tool-name">
                  {h.titulo.replace('Autodiagnóstico', 'Auto\u00ADdiagnóstico')}
                </h3>
                <p className="tool-desc">{h.texto}</p>
                <dl className="tool-meta">
                  {h.meta.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <ToolStatus id={h.id} tutorStatus={tutorStatus} />
                <button className="btn btn-primary tool-cta" onClick={() => onNavigate(h.id)}>
                  {h.cta} <Icon name="arrow" size={18} />
                </button>
              </div>
              <div className="tool-art" data-reveal style={{ '--d': 1 }}>
                <ToolGraphic kind={h.graphic} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ---------- CIERRE ---------- */}
      <section className="section container closing" aria-labelledby="closing-title">
        <p className="label section-label" data-reveal>
          Antes del próximo parcial
        </p>
        <h2 id="closing-title" className="closing-title" data-reveal>
          ¿Lo sabes… <span className="serif-accent">o lo copiaste?</span>
        </h2>
        <div className="closing-actions" data-reveal style={{ '--d': 1 }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('laboratorio')}>
            Compruébalo en 2 minutos <Icon name="arrow" size={18} />
          </button>
          <p className="muted">Empieza por el laboratorio. No necesitas cuenta ni conexión al modelo.</p>
        </div>
      </section>
    </div>
  );
}
