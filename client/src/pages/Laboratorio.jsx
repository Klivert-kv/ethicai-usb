import { useState } from 'react';
import { RETOS } from '../data/retos.js';
import { scoreChallenge, summarizeLab, scoreLabel, PENALIZACION } from '../lib/labScoring.js';
import Icon from '../components/Icon.jsx';
import ScoreBadge from '../components/ScoreBadge.jsx';

const STATE_TEXT = {
  hit: 'Error encontrado',
  missed: 'Error que se te pasó',
  'false-positive': 'Era correcta',
  neutral: 'Correcta',
};

function Progress({ currentIndex, resultados }) {
  return (
    <ol className="lab-progress" aria-label="Progreso del laboratorio">
      {RETOS.map((r, i) => {
        const done = Boolean(resultados[r.id]);
        const cur = i === currentIndex;
        return (
          <li key={r.id} className={`${done ? 'is-done' : ''} ${cur ? 'is-current' : ''}`}>
            <span className="sr-only">
              Reto {i + 1}: {done ? 'completado' : cur ? 'en curso' : 'pendiente'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ChallengeList({ resultados, onOpen, onSummary }) {
  const resumen = summarizeLab(resultados);
  return (
    <div className="page">
      <header className="page-header">
        <p className="label eyebrow">Laboratorio de verificación · 01</p>
        <h1 className="display-l">
          Atrapa la <span className="serif-accent">alucinación</span>
        </h1>
        <p className="lead">
          Cada reto muestra una respuesta que parece escrita por una IA. Esconde entre 2 y 3 errores. Tu trabajo es
          encontrarlos antes de que alguien los copie.
        </p>
      </header>

      <ol className="steps-inline" aria-label="Cómo funciona">
        <li>
          <span className="mono">01</span> Lee la respuesta
        </li>
        <li>
          <span className="mono">02</span> Marca las afirmaciones falsas
        </li>
        <li>
          <span className="mono">03</span> Revisa y aprende por qué
        </li>
      </ol>

      <ul className="challenge-list">
        {RETOS.map((r, i) => {
          const res = resultados[r.id];
          return (
            <li key={r.id} data-reveal style={{ '--d': i }}>
              <button className="challenge-card" onClick={() => onOpen(r.id)}>
                <span className="challenge-index" aria-hidden="true">
                  0{i + 1}
                </span>
                <span className="challenge-body">
                  <span className="challenge-top">
                    <span className="tag">{r.tema}</span>
                    <span className="label">{r.nivel}</span>
                  </span>
                  <span className="challenge-title">{r.titulo}</span>
                  <span className="challenge-q">{r.pregunta}</span>
                </span>
                <span className={`challenge-status ${res ? 'is-done' : ''}`}>
                  {res ? (
                    <>
                      <span className="challenge-score">{res.puntaje}</span>
                      <span className="label">
                        {res.detectados.length}/{res.total} errores
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Empezar</span> <Icon name="arrow" size={18} />
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="rule-note">
        <Icon name="alert" size={16} /> Marcar todo no sirve: cada afirmación correcta que marques resta medio punto.
      </p>

      {resumen.completados > 0 && (
        <div className="lab-footer">
          <span>
            <strong>{resumen.completados}</strong> de {RETOS.length} retos · promedio <strong>{resumen.promedio}</strong>/100
          </span>
          <button className="btn btn-quiet" onClick={onSummary}>
            Ver resumen <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function ChallengeView({ reto, index, selected, result, resultados, onToggle, onSubmit, onRetry, onNext, onBack, isLast, onSummary }) {
  const submitted = Boolean(result);
  const errorBySeg = Object.fromEntries(reto.errores.map((e) => [e.segmentoId, e]));
  const selectedSet = new Set(selected);

  const segmentState = (segId) => {
    if (!submitted) return selectedSet.has(segId) ? 'selected' : '';
    const isError = Boolean(errorBySeg[segId]);
    const isSel = selectedSet.has(segId);
    if (isError && isSel) return 'hit';
    if (isError && !isSel) return 'missed';
    if (!isError && isSel) return 'false-positive';
    return 'neutral';
  };

  return (
    <div className="page">
      <div className="lab-topbar">
        <button className="link-btn back" onClick={onBack}>
          <Icon name="back" size={16} /> Todos los retos
        </button>
        <div className="lab-topbar-progress">
          <span className="label">
            Reto {index + 1} de {RETOS.length}
          </span>
          <Progress currentIndex={index} resultados={resultados} />
        </div>
      </div>

      <header className="page-header compact">
        <p className="label eyebrow">
          {reto.tema} · {reto.nivel}
        </p>
        <h1 className="display-s">{reto.titulo}</h1>
      </header>

      <div className="lab-layout">
        <div className="lab-main">
          <section className="case" aria-label="Pregunta del estudiante">
            <p className="label">Pregunta del estudiante</p>
            <p className="case-q">{reto.pregunta}</p>
            {reto.codigo && (
              <pre className="snippet">
                <code>{reto.codigo}</code>
              </pre>
            )}
          </section>

          <section className="ai-answer" aria-label="Respuesta generada por IA">
            <div className="ai-answer-head">
              <span className="label">Respuesta generada por IA</span>
              <span className="label">{reto.segmentos.length} afirmaciones</span>
            </div>
            <ol className="claims">
              {reto.segmentos.map((s, si) => {
                const state = segmentState(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      style={{ '--i': si }}
                      className={`segment ${state ? `is-${state}` : ''}`}
                      aria-pressed={!submitted ? selectedSet.has(s.id) : undefined}
                      disabled={submitted}
                      onClick={() => onToggle(s.id)}
                    >
                      <span className="claim-n" aria-hidden="true">
                        {String(si + 1).padStart(2, '0')}
                      </span>
                      <span className="claim-text">{s.texto}</span>
                      <span className="claim-mark" aria-hidden="true">
                        {!submitted ? (selectedSet.has(s.id) ? 'Falsa' : '') : STATE_TEXT[state]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="lab-side" aria-live="polite">
          {!submitted ? (
            <div className="lab-panel">
              <p className="label">Tu revisión</p>
              <p className="lab-count">
                <span className="lab-count-n">{selected.length}</span>
                <span>afirmación(es) marcada(s) como falsa(s)</span>
              </p>
              <p className="muted small">
                Haz clic en cada afirmación que creas falsa. Puedes desmarcarla con otro clic. Hay entre 2 y 3 errores.
              </p>
              <button className="btn btn-primary btn-block" onClick={onSubmit} disabled={selected.length === 0}>
                Revisar mi respuesta
              </button>
            </div>
          ) : (
            <div className="lab-result">
              <div className="result-head">
                <ScoreBadge value={result.puntaje} />
                <div>
                  <p className="result-label">{scoreLabel(result.puntaje)}</p>
                  <p className="muted small">
                    {result.detectados.length} de {result.total} errores encontrados · {result.falsosPositivos.length}{' '}
                    correcta(s) marcada(s)
                  </p>
                </div>
              </div>

              <ol className="explanations">
                {reto.errores.map((e, ei) => {
                  const found = result.detectados.includes(e.id);
                  const seg = reto.segmentos.find((s) => s.id === e.segmentoId);
                  return (
                    <li key={e.id} className={found ? 'is-hit' : 'is-missed'} style={{ '--i': ei }}>
                      <p className="exp-head">
                        <Icon name={found ? 'check' : 'alert'} size={16} />
                        <span className="tag">{e.tipo}</span>
                        <span className="small">{found ? 'Lo encontraste' : 'Se te pasó'}</span>
                      </p>
                      <p className="exp-quote">«{seg.texto}»</p>
                      <p>{e.explicacion}</p>
                      <p className="exp-verify">
                        <strong>Cómo verificarlo:</strong> {e.verificacion}
                      </p>
                    </li>
                  );
                })}
              </ol>

              <div className="reference">
                <p className="label">Respuesta correcta de referencia</p>
                <p>{reto.solucion}</p>
              </div>

              <p className="formula">
                Puntaje = (aciertos − {PENALIZACION} × correctas marcadas) ÷ errores × 100, mínimo 0
              </p>

              <div className="result-actions">
                <button className="btn btn-quiet" onClick={onRetry}>
                  <Icon name="refresh" size={16} /> Repetir
                </button>
                {isLast ? (
                  <button className="btn btn-primary" onClick={onSummary}>
                    Ver resumen <Icon name="arrow" size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={onNext}>
                    Siguiente reto <Icon name="arrow" size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Summary({ resultados, onBack, onOpen, onReset }) {
  const resumen = summarizeLab(resultados);
  return (
    <div className="page">
      <button className="link-btn back" onClick={onBack}>
        <Icon name="back" size={16} /> Todos los retos
      </button>
      <header className="page-header compact">
        <p className="label eyebrow">Resumen del laboratorio</p>
        <h1 className="display-m">
          Encontraste {resumen.encontrados} de {resumen.totalErrores} errores
        </h1>
        <p className="lead">
          Si se te pasó alguno, eso es justo lo que ocurre al copiar una respuesta sin revisarla: las alucinaciones suenan
          seguras y están bien redactadas.
        </p>
      </header>

      <div className="summary-layout">
        <div className="summary-score">
          <ScoreBadge value={resumen.promedio} size={140} />
          <p className="label">Promedio de {resumen.completados} reto(s)</p>
        </div>
        <ul className="summary-list">
          {RETOS.map((r, i) => {
            const res = resultados[r.id];
            return (
              <li key={r.id}>
                <span>
                  <span className="mono muted">0{i + 1}</span> {r.titulo}
                </span>
                {res ? (
                  <span className="summary-score-pill">{res.puntaje}/100</span>
                ) : (
                  <button className="link-btn" onClick={() => onOpen(r.id)}>
                    Pendiente — hacerlo
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <section className="takeaways" aria-labelledby="takeaways-title">
        <h2 id="takeaways-title" className="display-s">
          Tres formas en que la IA se equivoca
        </h2>
        <ol className="takeaway-grid">
          <li>
            <span className="mono">01</span>
            <strong>Datos falsos con tono seguro</strong>
            <span className="muted">El límite de range, TRUNCATE con WHERE.</span>
          </li>
          <li>
            <span className="mono">02</span>
            <strong>Errores que arrastran conclusiones</strong>
            <span className="muted">Si una premisa es falsa, el resultado también.</span>
          </li>
          <li>
            <span className="mono">03</span>
            <strong>Fuentes inventadas</strong>
            <span className="muted">Autor real, título y año falsos. Busca siempre la fuente original.</span>
          </li>
        </ol>
      </section>

      <button className="btn btn-quiet" onClick={onReset}>
        <Icon name="refresh" size={16} /> Reiniciar laboratorio
      </button>
    </div>
  );
}

export default function Laboratorio() {
  const [view, setView] = useState({ type: 'list' });
  const [selecciones, setSelecciones] = useState({});
  const [resultados, setResultados] = useState({});

  const open = (id) => {
    setView({ type: 'challenge', id });
    window.scrollTo({ top: 0 });
  };

  if (view.type === 'summary') {
    return (
      <Summary
        resultados={resultados}
        onBack={() => setView({ type: 'list' })}
        onOpen={open}
        onReset={() => {
          setSelecciones({});
          setResultados({});
          setView({ type: 'list' });
        }}
      />
    );
  }

  if (view.type === 'challenge') {
    const index = RETOS.findIndex((r) => r.id === view.id);
    const reto = RETOS[index];
    const selected = selecciones[reto.id] || [];
    const result = resultados[reto.id];
    return (
      <ChallengeView
        key={reto.id}
        reto={reto}
        index={index}
        selected={selected}
        result={result}
        resultados={resultados}
        isLast={index === RETOS.length - 1}
        onToggle={(segId) =>
          setSelecciones((prev) => {
            const cur = new Set(prev[reto.id] || []);
            cur.has(segId) ? cur.delete(segId) : cur.add(segId);
            return { ...prev, [reto.id]: [...cur] };
          })
        }
        onSubmit={() => setResultados((prev) => ({ ...prev, [reto.id]: scoreChallenge(reto, selected) }))}
        onRetry={() => {
          setSelecciones((prev) => ({ ...prev, [reto.id]: [] }));
          setResultados((prev) => {
            const next = { ...prev };
            delete next[reto.id];
            return next;
          });
        }}
        onNext={() => open(RETOS[index + 1].id)}
        onBack={() => setView({ type: 'list' })}
        onSummary={() => {
          setView({ type: 'summary' });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return <ChallengeList resultados={resultados} onOpen={open} onSummary={() => setView({ type: 'summary' })} />;
}
