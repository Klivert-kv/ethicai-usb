import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '..', '..');

// El .env vive en la raíz del proyecto (junto a .env.example).
dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

function toInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

const VALID_THINK = new Set(['low', 'medium', 'high']);

/**
 * Construye la configuración a partir de variables de entorno.
 * Recibe `env` como parámetro para poder probarla sin tocar process.env.
 */
export function loadConfig(env = process.env) {
  const think = (env.OLLAMA_THINK || '').trim().toLowerCase();
  return {
    port: toInt(env.PORT, 3001, { max: 65535 }),
    clientOrigin: (env.CLIENT_ORIGIN || 'http://localhost:5173').trim(),
    ollamaBaseUrl: (env.OLLAMA_BASE_URL || 'http://localhost:11434').trim().replace(/\/+$/, ''),
    ollamaModel: (env.OLLAMA_MODEL || 'gpt-oss:20b-cloud').trim(),
    ollamaThink: VALID_THINK.has(think) ? think : '',
    ollamaTimeoutMs: toInt(env.OLLAMA_TIMEOUT_MS, 90000, { min: 5000, max: 600000 }),
    tutorRateLimitPerMinute: toInt(env.TUTOR_RATE_LIMIT_PER_MINUTE, 20, { max: 1000 }),
    clientDistDir: path.join(ROOT_DIR, 'client', 'dist'),
  };
}
