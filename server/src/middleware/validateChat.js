import { MIN_HINT_LEVEL, MAX_HINT_LEVEL } from '../prompts/tutorSystemPrompt.js';

export const LIMITS = {
  maxIncomingMessages: 40, // el cliente no debería enviar más que esto
  maxHistoryForModel: 16, // solo los últimos mensajes llegan al modelo
  maxUserChars: 2000,
  maxAssistantChars: 8000,
  maxActivityChars: 300,
};

// Elimina caracteres de control (excepto salto de línea y tabulación).
function clean(text) {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/**
 * Valida y normaliza el cuerpo de POST /api/tutor/chat.
 * Devuelve { ok: true, value } o { ok: false, message }.
 */
export function validateChatRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'La solicitud no tiene un formato válido.' };
  }

  const { messages, hintLevel, activity } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, message: 'Debes enviar al menos un mensaje.' };
  }
  if (messages.length > LIMITS.maxIncomingMessages) {
    return { ok: false, message: 'La conversación es demasiado larga. Inicia una conversación nueva.' };
  }

  const normalized = [];
  for (const m of messages) {
    if (!m || typeof m !== 'object') return { ok: false, message: 'Hay un mensaje con formato inválido.' };
    if (m.role !== 'user' && m.role !== 'assistant') {
      return { ok: false, message: 'Hay un mensaje con un rol no permitido.' };
    }
    if (typeof m.content !== 'string') return { ok: false, message: 'Hay un mensaje sin texto.' };
    const content = clean(m.content).trim();
    if (!content) return { ok: false, message: 'No se pueden enviar mensajes vacíos.' };
    const max = m.role === 'user' ? LIMITS.maxUserChars : LIMITS.maxAssistantChars;
    if (content.length > max) {
      return {
        ok: false,
        message:
          m.role === 'user'
            ? `Tu mensaje supera el límite de ${LIMITS.maxUserChars} caracteres.`
            : 'Un mensaje del historial es demasiado largo.',
      };
    }
    normalized.push({ role: m.role, content });
  }

  if (normalized[normalized.length - 1].role !== 'user') {
    return { ok: false, message: 'El último mensaje debe ser del estudiante.' };
  }

  let level = MIN_HINT_LEVEL;
  if (hintLevel !== undefined) {
    if (!Number.isInteger(hintLevel) || hintLevel < MIN_HINT_LEVEL || hintLevel > MAX_HINT_LEVEL) {
      return { ok: false, message: 'El nivel de ayuda no es válido.' };
    }
    level = hintLevel;
  }

  let act = '';
  if (activity !== undefined && activity !== null) {
    if (typeof activity !== 'string') return { ok: false, message: 'La actividad no es válida.' };
    act = clean(activity).trim().replace(/\s+/g, ' ');
    if (act.length > LIMITS.maxActivityChars) {
      return { ok: false, message: `La actividad supera ${LIMITS.maxActivityChars} caracteres.` };
    }
  }

  // Límite de historial: se conservan los últimos N mensajes, empezando por uno del estudiante.
  let history = normalized.slice(-LIMITS.maxHistoryForModel);
  while (history.length > 1 && history[0].role !== 'user') history = history.slice(1);

  return { ok: true, value: { messages: history, hintLevel: level, activity: act } };
}
