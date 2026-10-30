import { useCallback, useRef, useState } from 'react';
import { sendTutorMessage } from '../services/api.js';

export const MAX_CHARS = 2000;
export const MAX_MESSAGES = 30; // límite de la sesión antes de pedir una conversación nueva
export const STUCK_MESSAGE = 'Sigo atascado con esta actividad. ¿Me das otra pista?';

export const HINT_NAMES = {
  1: 'Pregunta orientadora',
  2: 'Pista concreta',
  3: 'Pista explícita',
  4: 'Ejemplo análogo',
};

/**
 * Estado del Tutor socrático.
 * - Historial solo en memoria (no se guarda en el navegador ni en el servidor).
 * - El nivel de pista pertenece a la ACTIVIDAD: solo sube con "Sigo atascado"
 *   y se reinicia a 1 al cambiar de actividad o empezar una conversación nueva.
 */
export function useTutorChat() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [activity, setActivityState] = useState('');
  const [hintLevel, setHintLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // { message, retry: { text, level } }
  const inFlight = useRef(false);

  const send = useCallback(
    async (rawText, { level = hintLevel } = {}) => {
      const text = rawText.trim();
      if (!text || inFlight.current) return false;
      if (text.length > MAX_CHARS) {
        setError({ message: `Tu mensaje supera ${MAX_CHARS} caracteres.`, retry: null });
        return false;
      }
      if (messages.length >= MAX_MESSAGES) {
        setError({ message: 'Esta conversación llegó al límite. Inicia una conversación nueva.', retry: null });
        return false;
      }

      inFlight.current = true;
      const userMsg = { id: crypto.randomUUID?.() ?? String(Date.now()), role: 'user', content: text, level };
      const history = [...messages, userMsg];
      setMessages(history);
      setDraft('');
      setError(null);
      setLoading(true);

      try {
        const data = await sendTutorMessage({
          messages: history.map(({ role, content }) => ({ role, content })),
          hintLevel: level,
          activity: activity.trim(),
        });
        setMessages((prev) => [
          ...prev,
          { id: `${userMsg.id}-r`, role: 'assistant', content: data.reply, level: data.hintLevel ?? level },
        ]);
        return true;
      } catch (err) {
        // Se quita el mensaje no respondido y se devuelve el texto al campo para no perderlo.
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        if (text !== STUCK_MESSAGE) setDraft((d) => d || text);
        setError({ message: err.message || 'No se pudo obtener respuesta.', code: err.code, retry: { text, level } });
        return false;
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [messages, hintLevel, activity],
  );

  const askForNextHint = useCallback(() => {
    const next = Math.min(4, hintLevel + 1);
    setHintLevel(next);
    return send(STUCK_MESSAGE, { level: next });
  }, [hintLevel, send]);

  const retry = useCallback(() => {
    if (!error?.retry) return;
    if (error.retry.text !== STUCK_MESSAGE) setDraft('');
    send(error.retry.text, { level: error.retry.level });
  }, [error, send]);

  const setActivity = useCallback((value) => {
    setActivityState(value);
  }, []);

  /** Nueva actividad: reinicia el contador de pistas, conserva la conversación. */
  const startNewActivity = useCallback((value) => {
    setActivityState(value);
    setHintLevel(1);
  }, []);

  /** Nueva conversación: borra historial, actividad y contador. */
  const reset = useCallback(() => {
    setMessages([]);
    setActivityState('');
    setHintLevel(1);
    setError(null);
  }, []);

  return {
    messages,
    draft,
    setDraft,
    activity,
    setActivity,
    startNewActivity,
    hintLevel,
    loading,
    error,
    dismissError: () => setError(null),
    send,
    askForNextHint,
    retry,
    reset,
  };
}
