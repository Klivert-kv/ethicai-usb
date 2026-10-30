/**
 * Puntuación de "Atrapa la alucinación" (determinista, sin IA).
 *
 *   puntos  = max(0, aciertos − 0,5 × selecciones_incorrectas)
 *   puntaje = redondear(puntos / total_de_errores × 100)   → 0 a 100
 *
 * La penalización evita que marcar todo dé ventaja: si marcas todas las
 * frases, las selecciones incorrectas anulan los aciertos.
 */
export const PENALIZACION = 0.5;

export function scoreChallenge(reto, selectedIds) {
  const validIds = new Set(reto.segmentos.map((s) => s.id));
  const selected = new Set((selectedIds || []).filter((id) => validIds.has(id)));
  const errorSegments = new Set(reto.errores.map((e) => e.segmentoId));

  const detectados = reto.errores.filter((e) => selected.has(e.segmentoId)).map((e) => e.id);
  const omitidos = reto.errores.filter((e) => !selected.has(e.segmentoId)).map((e) => e.id);
  const falsosPositivos = [...selected].filter((id) => !errorSegments.has(id));

  const total = reto.errores.length;
  const puntos = Math.max(0, detectados.length - PENALIZACION * falsosPositivos.length);
  const puntaje = total === 0 ? 0 : Math.round((puntos / total) * 100);

  return { detectados, omitidos, falsosPositivos, puntos, total, puntaje };
}

/** Resumen de los retos completados: promedio de puntajes y errores encontrados. */
export function summarizeLab(resultados) {
  const valores = Object.values(resultados || {});
  if (valores.length === 0) return { completados: 0, promedio: 0, encontrados: 0, totalErrores: 0 };
  const promedio = Math.round(valores.reduce((s, r) => s + r.puntaje, 0) / valores.length);
  const encontrados = valores.reduce((s, r) => s + r.detectados.length, 0);
  const totalErrores = valores.reduce((s, r) => s + r.total, 0);
  return { completados: valores.length, promedio, encontrados, totalErrores };
}

export function scoreLabel(puntaje) {
  if (puntaje >= 100) return 'Ojo de verificador';
  if (puntaje >= 67) return 'Muy bien';
  if (puntaje >= 34) return 'Vas por buen camino';
  return 'La IA te habría engañado';
}
