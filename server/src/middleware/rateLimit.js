/**
 * Control básico de frecuencia en memoria (ventana fija por IP).
 * Suficiente para un MVP en un solo equipo; no persiste nada.
 */
export function createRateLimiter({ windowMs = 60000, max = 20, now = () => Date.now() } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const key = req.ip || 'local';
    const t = now();
    let entry = hits.get(key);
    if (!entry || t >= entry.resetAt) {
      entry = { count: 0, resetAt: t + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    // Limpieza simple para que el mapa no crezca sin control.
    if (hits.size > 1000) {
      for (const [k, v] of hits) if (t >= v.resetAt) hits.delete(k);
    }

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - t) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: `Enviaste muchos mensajes seguidos. Espera ${retryAfter} s e inténtalo de nuevo.`,
        },
      });
    }
    return next();
  };
}
