import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTutorChat, MAX_CHARS, HINT_NAMES } from '../hooks/useTutorChat.js';
import { getTutorStatus } from '../services/api.js';
import MessageContent from '../components/MessageContent.jsx';
import Icon from '../components/Icon.jsx';

const SUGERENCIAS = [
  'Hazme el taller: una función en Python que calcule el promedio de una lista.',
  '¿Qué diferencia hay entre una clave primaria y una clave foránea?',
  'No entiendo por qué p → q es verdadera cuando p es falsa.',
  '¿Cómo sé si una cita que me dio un chatbot es real?',
];

function StatusPill({ status, onCheck, checking }) {
  let tone = 'unknown';
  let text = 'Comprobando conexión…';
  if (status) {
    if (!status.server) {
      tone = 'bad';
      text = 'Servidor no disponible';
    } else if (!status.reachable) {
      tone = 'bad';
      text = 'Ollama no responde';
    } else if (!status.modelAvailable) {
      tone = 'warn';
      text = 'Modelo no registrado en Ollama';
    } else {
      tone = 'ok';
      text = `Conectado · ${status.model}`;
    }
  }
  return (
    <span className="status-wrap">
      <span className={`status-pill tone-${tone}`} role="status">
        <span className="status-dot" aria-hidden="true" /> {text}
      </span>
      <button className="link-btn small" onClick={onCheck} disabled={checking}>
        {checking ? 'Comprobando…' : 'Comprobar'}
      </button>
    </span>
  );
}

function HintLadder({ level }) {
  return (
    <div className="hint-meter" aria-label={`Nivel de ayuda ${level} de 4: ${HINT_NAMES[level]}`}>
      <p className="label">Nivel de ayuda</p>
      <p className="hint-current">
        Nivel {level}: <strong>{HINT_NAMES[level]}</strong>
      </p>
      <ol className="hint-ladder" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className={`${n < level ? 'is-past' : ''} ${n === level ? 'is-on' : ''}`}>
            <span className="mono">{n}</span> {HINT_NAMES[n]}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Tutor({ active }) {
  const chat = useTutorChat();
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [activityDraft, setActivityDraft] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const check = async () => {
    setChecking(true);
    setStatus(await getTutorStatus());
    setChecking(false);
  };

  useEffect(() => {
    if (active && !status) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length, chat.loading]);

  // El campo de escritura crece con el contenido (hasta un máximo).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [chat.draft]);

  const submit = (e) => {
    e.preventDefault();
    chat.send(chat.draft);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chat.send(chat.draft);
    }
  };

  const applyActivity = (e) => {
    e.preventDefault();
    chat.startNewActivity(activityDraft.trim());
  };

  const hasAssistant = chat.messages.some((m) => m.role === 'assistant');
  const remaining = MAX_CHARS - chat.draft.length;

  return (
    <div className="page tutor-page">
      <header className="page-header tutor-header">
        <div>
          <p className="label eyebrow">Tutor socrático · 02</p>
          <h1 className="display-m tutor-title">
            Pregunta. <span className="serif-accent">Te guío,</span> no te lo resuelvo.
          </h1>
        </div>
        <StatusPill status={status} onCheck={check} checking={checking} />
      </header>

      <div className="tutor-layout">
        <section className="chat" aria-label="Conversación con el tutor">
          <div className="chat-list" ref={listRef} aria-live="polite">
            {chat.messages.length === 0 && (
              <div className="chat-empty">
                <p className="chat-empty-title">
                  ¿Qué quieres <span className="serif-accent">entender</span> hoy?
                </p>
                <p className="muted">Escribe tu duda o empieza con una de estas preguntas.</p>
                <ul className="suggestions">
                  {SUGERENCIAS.map((s, i) => (
                    <li key={s}>
                      <button className="suggestion" onClick={() => chat.send(s)} disabled={chat.loading}>
                        <span className="mono" aria-hidden="true">
                          0{i + 1}
                        </span>
                        <span>{s}</span>
                        <Icon name="arrow" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {chat.messages.map((m) => (
              <div key={m.id} className={`msg msg-${m.role}`}>
                <div className="msg-meta">
                  <span className="msg-author">{m.role === 'user' ? 'Tú' : 'Tutor'}</span>
                  {m.role === 'assistant' && <span className="msg-level">{HINT_NAMES[m.level]}</span>}
                </div>
                <div className="msg-bubble">
                  {m.role === 'user' ? <p className="msg-plain">{m.content}</p> : <MessageContent text={m.content} />}
                </div>
              </div>
            ))}

            {chat.loading && (
              <div className="msg msg-assistant is-loading">
                <div className="msg-meta">
                  <span className="msg-author">Tutor</span>
                </div>
                <div className="msg-bubble typing" role="status">
                  <span className="dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="muted small">Pensando en una buena pregunta…</span>
                </div>
              </div>
            )}
          </div>

          {chat.error && (
            <div className="alert" role="alert">
              <Icon name="alert" size={18} />
              <div className="alert-body">
                <p>{chat.error.message}</p>
                <p className="small muted">El laboratorio y el autodiagnóstico siguen funcionando sin el tutor.</p>
              </div>
              <div className="alert-actions">
                {chat.error.retry && (
                  <button className="btn btn-secondary btn-sm" onClick={chat.retry} disabled={chat.loading}>
                    <Icon name="refresh" size={16} /> Reintentar
                  </button>
                )}
                <button className="icon-btn" onClick={chat.dismissError} aria-label="Cerrar aviso">
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
          )}

          <form className="composer" onSubmit={submit}>
            <label htmlFor="tutor-input" className="sr-only">
              Escribe tu pregunta
            </label>
            <div className={`composer-box ${chat.loading ? 'is-busy' : ''}`}>
              <textarea
                id="tutor-input"
                ref={inputRef}
                className="composer-input"
                rows={1}
                maxLength={MAX_CHARS}
                placeholder="Escribe tu duda…"
                value={chat.draft}
                onChange={(e) => chat.setDraft(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button className="btn btn-primary composer-send" type="submit" disabled={chat.loading || !chat.draft.trim()}>
                {chat.loading ? 'Generando…' : 'Enviar'} <Icon name="send" size={16} />
              </button>
            </div>
            <div className="composer-bar">
              <span className="small muted">Enter envía · Shift + Enter, nueva línea</span>
              <span className={`small ${remaining < 100 ? 'warn-text' : 'muted'}`}>{remaining} caracteres</span>
            </div>
          </form>
        </section>

        <aside className="tutor-side" aria-label="Sesión de estudio">
          <form className="side-block" onSubmit={applyActivity}>
            <label htmlFor="activity" className="label">
              Actividad
            </label>
            <input
              id="activity"
              className="input"
              value={activityDraft}
              maxLength={300}
              placeholder="Ej.: Taller 3, ejercicio de bucles"
              onChange={(e) => setActivityDraft(e.target.value)}
            />
            <button className="btn btn-quiet btn-sm" type="submit" disabled={activityDraft.trim() === chat.activity}>
              {chat.activity ? 'Cambiar actividad' : 'Fijar actividad'}
            </button>
            {chat.activity && (
              <p className="small muted">
                En curso: <strong className="text">{chat.activity}</strong>
              </p>
            )}
          </form>

          <div className="side-block hint-box">
            <HintLadder level={chat.hintLevel} />
            <button
              className="btn btn-secondary btn-sm"
              onClick={chat.askForNextHint}
              disabled={!hasAssistant || chat.loading || chat.hintLevel >= 4}
            >
              <Icon name="bulb" size={16} /> Sigo atascado
            </button>
            <p className="small muted">
              {chat.hintLevel >= 4
                ? 'Nivel máximo: el tutor usa ejemplos análogos.'
                : 'Sube solo con este botón y vuelve al nivel 1 al cambiar de actividad.'}
            </p>
          </div>

          <div className="side-block">
            <button
              className="btn btn-quiet btn-sm"
              onClick={() => {
                chat.reset();
                setActivityDraft('');
              }}
            >
              <Icon name="plus" size={16} /> Nueva conversación
            </button>
            <p className="small muted">
              La conversación solo existe en esta pestaña. Los mensajes se envían al modelo en la nube de Ollama para
              generar la respuesta.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
