import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { createOllamaClient } from './services/ollamaService.js';
import { createTutorController } from './controllers/tutorController.js';
import { createTutorRouter } from './routes/tutorRoutes.js';
import { createRateLimiter } from './middleware/rateLimit.js';

/**
 * Crea la aplicación Express. Recibe la configuración y, opcionalmente,
 * un cliente de Ollama (útil para pruebas).
 */
export function createApp(config, { ollamaClient } = {}) {
  const app = express();
  app.disable('x-powered-by');

  const ollama =
    ollamaClient ||
    createOllamaClient({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      think: config.ollamaThink,
      timeoutMs: config.ollamaTimeoutMs,
    });

  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Frame-Options', 'DENY');
    next();
  });

  app.use('/api', cors({ origin: config.clientOrigin }));
  app.use('/api', express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', model: config.ollamaModel });
  });

  const controller = createTutorController(ollama);
  const limiter = createRateLimiter({ windowMs: 60000, max: config.tutorRateLimitPerMinute });
  app.use('/api/tutor', createTutorRouter(controller, limiter));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } });
  });

  // En modo demostración (npm run build + npm start) el backend también sirve el frontend.
  if (config.clientDistDir && fs.existsSync(path.join(config.clientDistDir, 'index.html'))) {
    app.use(express.static(config.clientDistDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(config.clientDistDir, 'index.html'));
    });
  }

  // Errores (JSON mal formado, cuerpo demasiado grande, etc.)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido.' } });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'La solicitud es demasiado grande.' } });
    }
    console.error('[servidor] Error no controlado:', err?.message);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado en el servidor.' } });
  });

  return app;
}
