/**
 * Cliente mínimo para APIs compatibles con OpenAI (POST /chat/completions, GET /models).
 * Sirve para proveedores con plan gratuito como Groq (openai/gpt-oss-20b), OpenRouter
 * o Gemini, cambiando solo LLM_BASE_URL, LLM_API_KEY y LLM_MODEL en el .env.
 *
 * Expone la misma interfaz que ollamaService ({ chat, status, model }) y reutiliza
 * OllamaError y ERROR_CODES, así el controlador, la interfaz y las pruebas no cambian.
 *
 * - Devuelve SOLO choices[0].message.content. Los campos de razonamiento
 *   (reasoning, reasoning_content) se descartan: no se devuelven ni se registran.
 * - La clave de API nunca se registra ni se devuelve al navegador.
 */

import { OllamaError, ERROR_CODES } from './ollamaService.js';
import { sanitizeReply } from './sanitizeReply.js';

function shortText(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

async function readErrorMessage(res) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      const msg = json?.error?.message ?? json?.error ?? json?.message;
      return shortText(typeof msg === 'string' ? msg : text);
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
      'El servicio del modelo rechazó la clave de API. Revisa LLM_API_KEY en el archivo .env.',
      { httpStatus: 502, detail },
    );
  }
  if (status === 404) {
    return new OllamaError(
      ERROR_CODES.MODEL_NOT_FOUND,
      'El servicio no encontró el modelo configurado. Revisa LLM_MODEL en el archivo .env.',
      { httpStatus: 502, detail },
    );
  }
  if (status === 402) {
    return new OllamaError(
      ERROR_CODES.REMOTE_RATE_LIMIT,
      'Se agotó la cuota gratuita del modelo en la nube. Inténtalo más tarde. El laboratorio y el autodiagnóstico siguen funcionando.',
      { httpStatus: 503, detail },
    );
  }
  if (status === 429 || status === 413) {
    // Groq responde 413 cuando la petición supera los tokens por minuto del plan gratuito.
    return new OllamaError(
      ERROR_CODES.REMOTE_RATE_LIMIT,
      'Se alcanzó el límite de uso del plan gratuito del modelo. Espera un minuto e inténtalo de nuevo.',
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
  return new OllamaError(ERROR_CODES.HTTP_ERROR, `El servicio del modelo rechazó la solicitud (HTTP ${status}).`, {
    httpStatus: 502,
    detail,
  });
}

export function createOpenAICompatClient({
  baseUrl,
  apiKey = '',
  model,
  reasoningEffort = '',
  timeoutMs = 90000,
  fetchImpl = globalThis.fetch,
}) {
  const authHeaders = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  async function request(pathname, init, ms) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, ms);
    try {
      const res = await fetchImpl(`${baseUrl}${pathname}`, { ...init, signal: controller.signal });
      return { res, timer, isTimedOut: () => timedOut };
    } catch (err) {
      clearTimeout(timer);
      if (timedOut || err?.name === 'AbortError') {
        throw new OllamaError(ERROR_CODES.TIMEOUT, 'El modelo tardó demasiado en responder. Inténtalo de nuevo.', {
          httpStatus: 504,
        });
      }
      throw new OllamaError(
        ERROR_CODES.UNREACHABLE,
        'No se pudo conectar con el servicio del modelo en la nube. Revisa la conexión a internet.',
        { httpStatus: 503, detail: shortText(err?.cause?.code || err?.message) },
      );
    }
  }

  async function chatOnce(messages, effort) {
    const body = { model, messages, stream: false };
    if (effort) body.reasoning_effort = effort;

    const { res, timer, isTimedOut } = await request(
      '/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body),
      },
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
        throw new OllamaError(ERROR_CODES.INVALID_RESPONSE, 'El servicio del modelo devolvió una respuesta que no es JSON válido.');
      }

      if (data && data.error) {
        const msg = typeof data.error === 'string' ? data.error : data.error.message;
        throw new OllamaError(ERROR_CODES.REMOTE_ERROR, 'El servicio del modelo devolvió un error.', {
          detail: shortText(msg),
        });
      }

      const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;
      const message = choice?.message;
      if (!message || typeof message !== 'object' || (message.content != null && typeof message.content !== 'string')) {
        throw new OllamaError(ERROR_CODES.INVALID_RESPONSE, 'La respuesta del modelo no tiene el formato esperado.');
      }

      const content = sanitizeReply(message.content || '');
      if (!content) {
        throw new OllamaError(
          ERROR_CODES.EMPTY_RESPONSE,
          'El modelo no devolvió texto para mostrar. Intenta reformular la pregunta.',
        );
      }

      // Solo se devuelven los campos necesarios. message.reasoning se descarta aquí.
      return {
        content,
        model: typeof data.model === 'string' ? data.model : model,
        doneReason: typeof choice.finish_reason === 'string' ? choice.finish_reason : undefined,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async function chat(messages) {
    try {
      return await chatOnce(messages, reasoningEffort);
    } catch (err) {
      // Si el modelo no admite "reasoning_effort" (HTTP 400), se reintenta UNA vez sin él.
      if (
        reasoningEffort &&
        err instanceof OllamaError &&
        err.upstreamStatus === 400 &&
        /reasoning/i.test(err.detail || '')
      ) {
        return chatOnce(messages, '');
      }
      throw err;
    }
  }

  /** Comprueba si el servicio responde, si la clave es válida y si el modelo existe. */
  async function status() {
    try {
      const { res, timer } = await request('/models', { method: 'GET', headers: authHeaders }, 5000);
      try {
        if (!res.ok) return { reachable: true, modelAvailable: false, model };
        const data = await res.json().catch(() => null);
        const models = Array.isArray(data?.data) ? data.data : [];
        const modelAvailable = models.some((m) => m?.id === model);
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
