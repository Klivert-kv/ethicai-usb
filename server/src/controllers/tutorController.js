import { validateChatRequest } from '../middleware/validateChat.js';
import { buildSystemPrompt, HINT_LEVELS } from '../prompts/tutorSystemPrompt.js';
import { OllamaError } from '../services/ollamaService.js';

export function createTutorController(ollama) {
  async function chat(req, res) {
    const validation = validateChatRequest(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: validation.message } });
    }

    const { messages, hintLevel, activity } = validation.value;
    const system = { role: 'system', content: buildSystemPrompt({ hintLevel, activity }) };

    try {
      const result = await ollama.chat([system, ...messages]);
      return res.json({ reply: result.content, model: result.model, hintLevel });
    } catch (err) {
      if (err instanceof OllamaError) {
        // Se registra solo el código y un detalle técnico corto, nunca el contenido de la conversación.
        console.warn(`[tutor] ${err.code}${err.detail ? ` — ${err.detail}` : ''}`);
        return res.status(err.httpStatus).json({ error: { code: err.code, message: err.message } });
      }
      console.error('[tutor] Error inesperado:', err?.message);
      return res
        .status(500)
        .json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado en el servidor.' } });
    }
  }

  async function status(_req, res) {
    const s = await ollama.status();
    res.json({ ...s, hintLevels: HINT_LEVELS.map(({ level, nombre }) => ({ level, nombre })) });
  }

  return { chat, status };
}
