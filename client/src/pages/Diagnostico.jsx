import { useState } from 'react';
import { PREGUNTAS, TEMAS, NIVELES_CONFIANZA, HABITOS, ESCALA_HABITOS } from '../data/quiz.js';
import { scoreQuiz, estimateDependency } from '../lib/quizScoring.js';
import Icon from '../components/Icon.jsx';
import { useCountUp } from '../hooks/useCountUp.js';

const LETRAS = ['A', 'B', 'C', 'D'];

const DEPENDENCIA_TEXTO = {
  bajo: 'Según lo que respondiste, usas la IA como apoyo y no como sustituto. Sigue verificando lo que te dice.',
  medio:
    'Hay momentos en que la IA hace parte del trabajo por ti. Prueba a intentar primero solo y usar el tutor socrático cuando te atasques.',
  alto: 'Según tus respuestas, la IA está haciendo buena parte del trabajo. No es un juicio: es una señal para cambiar el orden: primero tú, luego la IA para revisar.',
};

function BigPercent({ value }) {
  const shown = useCountUp(value);
  return (
    <span className="big-percent" aria-hidden="true">
      {shown}
      <span>%</span>
    </span>
  );
}

function Results({ resultado, dependencia, respuestas, onRetry }) {
  const fuertes = resultado.porTema.filter((t) => !t.necesitaRefuerzo);
  return (
    <div className="page">
      <header className="results-hero">
        <div>
          <p className="label eyebrow">Resultado del autodiagnóstico</p>
          <h1 className="display-l">
            {resultado.aciertos} de {resultado.total} respuestas correctas
          </h1>
          <p className="lead">
            Esto mide lo que demostraste hoy en cinco preguntas, no lo que vales. Úsalo para decidir qué repasar antes del
            parcial.
          </p>
        </div>
        <div className="results-score">
          <BigPercent value={resultado.porcentaje} />
          <span className="label">de aciertos · aciertos ÷ 5 × 100</span>
        </div>
      </header>

      <section className="topics-panel" aria-labelledby="temas-title">
        <h2 id="temas-title" className="label">
          Resultados por tema
        </h2>
        <ul className="topic-bars">
          {resultado.porTema.map((t) => (
            <li key={t.tema}>
              <div className="topic-row">
                <span>{t.tema}</span>
                <span className="mono">
                  {t.aciertos}/{t.total}
                  <span className={`topic-flag ${t.necesitaRefuerzo ? 'is-low' : 'is-ok'}`}>
                    {t.necesitaRefuerzo ? 'Reforzar' : 'Dominado'}
                  </span>
                </span>
              </div>
              <div className="bar" aria-hidden="true">
                <span className={`bar-fill ${t.necesitaRefuerzo ? 'is-low' : ''}`} style={{ width: `${t.porcentaje}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="results-grid">
        <section className="result-col" aria-labelledby="fuertes-title">
          <h2 id="fuertes-title" className="col-title">
            <span className="mono">01</span> Lo que dominas
          </h2>
          {fuertes.length ? (
            <ul className="plain-list">
              {fuertes.map((t) => (
                <li key={t.tema}>
                  <Icon name="check" size={16} /> {t.tema}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Ningún tema quedó completo esta vez. Es justo para lo que sirve el simulacro.</p>
          )}
        </section>

        <section className="result-col" aria-labelledby="repasar-title">
          <h2 id="repasar-title" className="col-title">
            <span className="mono">02</span> Qué repasar
          </h2>
          {resultado.temasRefuerzo.length === 0 ? (
            <p>No fallaste en ningún tema. Pon a prueba lo que sabes explicándoselo al tutor socrático.</p>
          ) : (
            <ul className="reco-list">
              {resultado.temasRefuerzo.map((t) => (
                <li key={t}>
                  <strong>{t}:</strong> {TEMAS[t].recomendacion}
                </li>
              ))}
            </ul>
          )}
          {resultado.excesoConfianza.length > 0 && (
            <p className="callout small">
              <Icon name="alert" size={16} />
              <span>
                Marcaste «Seguro» en {resultado.excesoConfianza.length} pregunta(s) que fallaste. Esos son los vacíos más
                peligrosos: no sabías que no sabías.
              </span>
            </p>
          )}
        </section>

        <section className="result-col" aria-labelledby="habitos-title">
          <h2 id="habitos-title" className="col-title">
            <span className="mono">03</span> Hábitos de uso de la IA
          </h2>
          {dependencia.nivel ? (
            <>
              <p className={`dep-level dep-${dependencia.nivel}`}>
                Dependencia {dependencia.nivel}
                <span className="small muted"> · {dependencia.suma} de {dependencia.max} puntos</span>
              </p>
              <p>{DEPENDENCIA_TEXTO[dependencia.nivel]}</p>
            </>
          ) : (
            <p>No respondiste las tres afirmaciones de autorreflexión, así que no se estimó este nivel.</p>
          )}
          <p className="small muted">
            Estimación educativa limitada, basada solo en lo que declaraste. No usa tu nota, no se guarda y no es un
            diagnóstico. Escala: 0–1 bajo, 2–3 medio, 4–6 alto.
          </p>
        </section>
      </div>

      <section aria-labelledby="revision-title">
        <h2 id="revision-title" className="display-s section-gap">
          Revisión pregunta por pregunta
        </h2>
        <ol className="review-list">
          {PREGUNTAS.map((p, i) => {
            const r = resultado.porPregunta.find((x) => x.id === p.id);
            const elegida = p.opciones.find((o) => o.id === respuestas[p.id]);
            const correcta = p.opciones.find((o) => o.id === p.correcta);
            return (
              <li key={p.id} className={r.acierto ? 'is-hit' : 'is-missed'}>
                <span className="review-n mono">0{i + 1}</span>
                <div className="review-body">
                  <p className="exp-head">
                    <Icon name={r.acierto ? 'check' : 'x'} size={16} />
                    <span className="small">{r.acierto ? 'Correcta' : 'Incorrecta'}</span>
                    <span className="tag">{p.tema}</span>
                  </p>
                  <p className="review-q">{p.enunciado}</p>
                  {!r.acierto && (
                    <p className="small">
                      Tu respuesta: <s>{elegida?.texto}</s>
                    </p>
                  )}
                  <p className="small">
                    Correcta: <strong>{correcta.texto}</strong>
                  </p>
                  <p className="small muted">{p.explicacion}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <button className="btn btn-primary" onClick={onRetry}>
        <Icon name="refresh" size={16} /> Repetir el autodiagnóstico
      </button>
    </div>
  );
}

export default function Diagnostico() {
  const [respuestas, setRespuestas] = useState({});
  const [confianza, setConfianza] = useState({});
  const [habitos, setHabitos] = useState({});
  const [enviado, setEnviado] = useState(false);

  const contestadas = PREGUNTAS.filter((p) => respuestas[p.id]).length;
  const completo = contestadas === PREGUNTAS.length;

  if (enviado) {
    return (
      <Results
        resultado={scoreQuiz(PREGUNTAS, respuestas, confianza)}
        dependencia={estimateDependency(HABITOS, habitos)}
        respuestas={respuestas}
        onRetry={() => {
          setRespuestas({});
          setConfianza({});
          setHabitos({});
          setEnviado(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="label eyebrow">Simulacro pre-examen · 03</p>
        <h1 className="display-l">
          Auto<span className="serif-accent">diagnóstico</span>
        </h1>
        <p className="lead">
          Cinco preguntas, sin ayuda de IA. Indica también qué tan seguro estás: así descubres los vacíos que no sabías que
          tenías.
        </p>
      </header>

      <form
        className="quiz-layout"
        onSubmit={(e) => {
          e.preventDefault();
          if (completo) {
            setEnviado(true);
            window.scrollTo({ top: 0 });
          }
        }}
      >
        <aside className="quiz-side">
          <p className="label">Progreso</p>
          <p className="quiz-count">
            <span className="quiz-count-n">{contestadas}</span>
            <span className="muted">/ {PREGUNTAS.length}</span>
          </p>
          <div className="progress" aria-label={`${contestadas} de ${PREGUNTAS.length} preguntas respondidas`}>
            <div className="progress-fill" style={{ width: `${(contestadas / PREGUNTAS.length) * 100}%` }} />
          </div>
          <ol className="quiz-map">
            {PREGUNTAS.map((p, i) => (
              <li key={p.id} className={respuestas[p.id] ? 'is-done' : ''}>
                <span className="mono">0{i + 1}</span> {p.tema}
              </li>
            ))}
          </ol>
          <button className="btn btn-primary btn-block" type="submit" disabled={!completo}>
            Ver mi resultado <Icon name="arrow" size={16} />
          </button>
          <p className="small muted">
            {completo ? 'Listo para ver tu resultado.' : `Te faltan ${PREGUNTAS.length - contestadas} pregunta(s).`}
          </p>
        </aside>

        <div className="quiz">
          {PREGUNTAS.map((p, i) => (
            <fieldset key={p.id} className={`question ${respuestas[p.id] ? 'is-answered' : ''}`}>
              <legend>
                <span className="q-num" aria-hidden="true">
                  0{i + 1}
                </span>
                <span className="q-head">
                  <span className="tag">{p.tema}</span>
                  <span className="q-text">{p.enunciado}</span>
                </span>
              </legend>
              <div className="options">
                {p.opciones.map((o, oi) => (
                  <label key={o.id} className={`option ${respuestas[p.id] === o.id ? 'is-checked' : ''}`}>
                    <input
                      type="radio"
                      name={p.id}
                      value={o.id}
                      checked={respuestas[p.id] === o.id}
                      onChange={() => setRespuestas((r) => ({ ...r, [p.id]: o.id }))}
                    />
                    <span className="option-letter" aria-hidden="true">
                      {LETRAS[oi]}
                    </span>
                    <span>{o.texto}</span>
                  </label>
                ))}
              </div>
              <div className="confidence" role="radiogroup" aria-label="¿Qué tan seguro estás?">
                <span className="label">¿Qué tan seguro estás?</span>
                {NIVELES_CONFIANZA.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    role="radio"
                    aria-checked={confianza[p.id] === c.id}
                    className={`chip ${confianza[p.id] === c.id ? 'is-on' : ''}`}
                    onClick={() => setConfianza((v) => ({ ...v, [p.id]: c.id }))}
                  >
                    {c.texto}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset className="question habits">
            <legend>
              <span className="q-num" aria-hidden="true">
                <Icon name="bulb" size={22} />
              </span>
              <span className="q-head">
                <span className="tag">Opcional · no afecta tu nota</span>
                <span className="q-text">Autorreflexión: ¿con qué frecuencia te pasa esto?</span>
              </span>
            </legend>
            {HABITOS.map((h) => (
              <div key={h.id} className="habit-row">
                <p>{h.texto}</p>
                <div className="confidence" role="radiogroup" aria-label={h.texto}>
                  {ESCALA_HABITOS.map((e) => (
                    <button
                      type="button"
                      key={e.valor}
                      role="radio"
                      aria-checked={habitos[h.id] === e.valor}
                      className={`chip ${habitos[h.id] === e.valor ? 'is-on' : ''}`}
                      onClick={() => setHabitos((v) => ({ ...v, [h.id]: e.valor }))}
                    >
                      {e.texto}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        </div>
      </form>
    </div>
  );
}
