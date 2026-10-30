/**
 * Cliente mínimo para la API HTTP de Ollama (POST /api/chat, GET /api/tags).
 *
 * - Usa streaming desactivado (stream: false) para tener una conversación estable.
 * - Devuelve SOLO message.content. El campo message.thinking (razonamiento interno
 *   de gpt-oss) se descarta: no se devuelve, no se guarda y no se registra.
 * - Distingue errores de conexión, tiempo de espera, HTTP, autenticación,
 *   cuota, servicio remoto y respuestas inválidas.
 */

import { sanitizeReply } from './sanitizeReply.js';

export class OllamaError extends Error {
  constructor(code, message, { httpStatus = 502, detail } = {}) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.detail = detail; // texto técnico corto, nunca contenido de la conversación
  }
}

export const ERROR_CODES = {
  UNREACHABLE: 'OLLAMA_UNREACHABLE',
  TIMEOUT: 'OLLAMA_TIMEOUT',
  AUTH: 'OLLAMA_AUTH_REQUIRED',
  MODEL_NOT_FOUND: 'OLLAMA_MODEL_NOT_FOUND',
  REMOTE_RATE_LIMIT: 'OLLAMA_REMOTE_RATE_LIMIT',
  REMOTE_ERROR: 'OLLAMA_REMOTE_ERROR',
  HTTP_ERROR: 'OLLAMA_HTTP_ERROR',
  INVALID_RESPONSE: 'OLLAMA_INVALID_RESPONSE',
  EMPTY_RESPONSE: 'OLLAMA_EMPTY_RESPONSE',
};

function shortText(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function readErrorMessage(res) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return shortText(typeof json.error === 'string' ? json.error : text);
    } catch {
      return shortText(text);
    }
  } catch {
    return '';
  }
}

function mapHttpError(status, detail) {
  if (status === 401 || status === 403) {
    return new OllamaError(
      ERROR_CODES.AUTH,
      'Ollama necesita que inicies sesión para usar el modelo en la nube. Ejecuta "ollama signin" en una terminal.',
      { httpStatus: 502, detail },
    );
  }
  if (status === 404) {
    return new OllamaError(
      ERROR_CODES.MODEL_NOT_FOUND,
      'Ollama no encontró el modelo configurado. Revisa OLLAMA_MODEL y ejecuta "ollama list".',
      { httpStatus: 502, detail },
    );
  }
  if (status === 429) {
    return new OllamaError(
      ERROR_CODES.REMOTE_RATE_LIMIT,
      'Se alcanzó el límite de uso del modelo en la nube. Espera un momento e inténtalo de nuevo.',
      { httpStatus: 503, detail },
    );
  }
  if (status >= 500) {
    return new OllamaError(
      ERROR_CODES.REMOTE_ERROR,
      'El servicio del modelo tuvo un problema temporal. Inténtalo de nuevo en unos segundos.',
      { httpStatus: 502, detail },
    );
  }
  return new OllamaError(
    ERROR_CODES.HTTP_ERROR,
    `Ollama rechazó la solicitud (HTTP ${status}).`,
    { httpStatus: 502, detail },
  );
}

export function createOllamaClient({
  baseUrl,
  model,
  think = '',
  timeoutMs = 90000,
  fetchImpl = globalThis.fetch,
}) {
  async function request(pathname, init, ms) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, ms);
    try {
      const res = await fetchImpl(`${baseUrl}${pathname}`, { ...init, signal: controller.signal });
      return { res, controller, timer, isTimedOut: () => timedOut };
    } catch (err) {
      clearTimeout(timer);
      if (timedOut || err?.name === 'AbortError') {
        throw new OllamaError(ERROR_CODES.TIMEOUT, 'El modelo tardó demasiado en responder. Inténtalo de nuevo.', {
          httpStatus: 504,
        });
      }
      throw new OllamaError(
        ERROR_CODES.UNREACHABLE,
        'No se pudo conectar con Ollama. Verifica que Ollama esté abierto en este equipo.',
        { httpStatus: 503, detail: shortText(err?.cause?.code || err?.message) },
      );
    }
  }

  async function chatOnce(messages, useThink) {
    const body = { model, messages, stream: false };
    if (useThink) body.think = useThink;

    const { res, timer, isTimedOut } = await request(
      '/api/chat',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      timeoutMs,
    );

    try {
      if (!res.ok) {
        const detail = await readErrorMessage(res);
        const error = mapHttpError(res.status, detail);
        error.upstreamStatus = res.status;
        throw error;
      }

      let data;
      try {
        data = await res.json();
      } catch (err) {
        if (isTimedOut() || err?.name === 'AbortError') {
          throw new OllamaError(ERROR_CODES.TIMEOUT, 'El modelo tardó demasiado en responder. Inténtalo de nuevo.', {
            httpStatus: 504,
          });
        }
        throw new OllamaError(ERROR_CODES.INVALID_RESPONSE, 'Ollama devolvió una respuesta que no es JSON válido.');
      }

      if (data && typeof data.error === 'string') {
        throw new OllamaError(ERROR_CODES.REMOTE_ERROR, 'El servicio del modelo devolvió un error.', {
          detail: shortText(data.error),
        });
      }

      const message = data?.message;
      if (!message || typeof message !== 'object' || typeof message.content !== 'string') {
        throw new OllamaError(ERROR_CODES.INVALID_RESPONSE, 'La respuesta del modelo no tiene el formato esperado.');
      }

      // Quita razonamiento interno que a veces se filtra dentro de content.
      const content = sanitizeReply(message.content);
      if (!content) {
        throw new OllamaError(
          ERROR_CODES.EMPTY_RESPONSE,
          'El modelo no devolvió texto para mostrar. Intenta reformular la pregunta.',
        );
      }

      // Solo se devuelven los campos necesarios. message.thinking se descarta aquí.
      return {
        content,
        model: typeof data.model === 'string' ? data.model : model,
        doneReason: typeof data.done_reason === 'string' ? data.done_reason : undefined,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async function chat(messages) {
    try {
      return await chatOnce(messages, think);
    } catch (err) {
      // Corrección mínima de compatibilidad: si esta versión de Ollama rechaza el
      // parámetro "think" (HTTP 400), se reintenta UNA vez sin él, con el mismo modelo.
      if (think && err instanceof OllamaError && err.upstreamStatus === 400 && /think/i.test(err.detail || '')) {
        return chatOnce(messages, '');
      }
      throw err;
    }
  }

  /** Comprueba si Ollama responde y si el modelo configurado está registrado. */
  async function status() {
    try {
      const { res, timer } = await request('/api/tags', { method: 'GET' }, 5000);
      try {
        if (!res.ok) return { reachable: true, modelAvailable: false, model };
        const data = await res.json().catch(() => null);
        const models = Array.isArray(data?.models) ? data.models : [];
        const modelAvailable = models.some((m) => m?.name === model || m?.model === model);
        return { reachable: true, modelAvailable, model };
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return { reachable: false, modelAvailable: false, model };
    }
  }

  return { chat, status, model };
}
