/** Cliente HTTP del frontend. Todas las llamadas pasan por el backend (/api). */

const CHAT_TIMEOUT_MS = 100000;

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function parseError(res) {
  try {
    const data = await res.json();
    if (data?.error?.message) return new ApiError(data.error.code || 'ERROR', data.error.message);
  } catch {
    /* sin cuerpo JSON */
  }
  return new ApiError(`HTTP_${res.status}`, `El servidor respondió con un error (HTTP ${res.status}).`);
}

export async function sendTutorMessage({ messages, hintLevel, activity }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    let res;
    try {
      res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, hintLevel, activity }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err?.name === 'AbortError') {
        throw new ApiError('CLIENT_TIMEOUT', 'La respuesta está tardando demasiado. Inténtalo de nuevo.');
      }
      throw new ApiError(
        'SERVER_UNREACHABLE',
        'No hay conexión con el servidor de EthicAI USB. Verifica que el backend esté en ejecución.',
      );
    }
    if (!res.ok) throw await parseError(res);
    const data = await res.json().catch(() => null);
    if (!data || typeof data.reply !== 'string') {
      throw new ApiError('INVALID_RESPONSE', 'El servidor devolvió una respuesta inesperada.');
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function getTutorStatus() {
  try {
    const res = await fetch('/api/tutor/status');
    if (!res.ok) return { server: true, reachable: false, modelAvailable: false };
    const data = await res.json();
    return { server: true, ...data };
  } catch {
    return { server: false, reachable: false, modelAvailable: false };
  }
}
