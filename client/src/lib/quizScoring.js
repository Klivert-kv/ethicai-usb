/**
 * Calificación del Autodiagnóstico (determinista, sin IA).
 *
 * CONOCIMIENTO
 *   aciertos = número de respuestas correctas (0 a 5)
 *   porcentaje = redondear(aciertos / 5 × 100)
 *   Un tema necesita refuerzo si su porcentaje es menor que 100 % (algún fallo en ese tema).
 *   "Exceso de confianza": preguntas marcadas como "Seguro" y respondidas mal.
 *
 * HÁBITOS (estimación educativa limitada, autodeclarada y opcional)
 *   suma de 3 afirmaciones (0 Nunca, 1 A veces, 2 Casi siempre) → 0 a 6
 *   0–1: bajo · 2–3: medio · 4–6: alto
 *   Solo se calcula si se respondieron las 3. La nota del cuestionario NO influye.
 */

export const UMBRAL_REFUERZO = 100;

export function scoreQuiz(preguntas, respuestas = {}, confianza = {}) {
  const porPregunta = preguntas.map((p) => {
    const elegida = respuestas[p.id] ?? null;
    return {
      id: p.id,
      tema: p.tema,
      elegida,
      correcta: p.correcta,
      acierto: elegida === p.correcta,
      confianza: confianza[p.id] ?? null,
    };
  });

  const aciertos = porPregunta.filter((r) => r.acierto).length;
  const total = preguntas.length;
  const porcentaje = total ? Math.round((aciertos / total) * 100) : 0;

  const temas = [];
  for (const r of porPregunta) {
    let t = temas.find((x) => x.tema === r.tema);
    if (!t) temas.push((t = { tema: r.tema, aciertos: 0, total: 0 }));
    t.total += 1;
    if (r.acierto) t.aciertos += 1;
  }
  for (const t of temas) {
    t.porcentaje = Math.round((t.aciertos / t.total) * 100);
    t.necesitaRefuerzo = t.porcentaje < UMBRAL_REFUERZO;
  }

  const excesoConfianza = porPregunta.filter((r) => !r.acierto && r.confianza === 'alta').map((r) => r.id);

  return {
    aciertos,
    total,
    porcentaje,
    porTema: temas,
    temasRefuerzo: temas.filter((t) => t.necesitaRefuerzo).map((t) => t.tema),
    excesoConfianza,
    porPregunta,
  };
}

export function estimateDependency(habitos, respuestas = {}) {
  const valores = habitos.map((h) => respuestas[h.id]).filter((v) => v === 0 || v === 1 || v === 2);
  const max = habitos.length * 2;
  if (valores.length < habitos.length) {
    return { nivel: null, suma: null, max, respondidas: valores.length };
  }
  const suma = valores.reduce((a, b) => a + b, 0);
  const nivel = suma <= 1 ? 'bajo' : suma <= 3 ? 'medio' : 'alto';
  return { nivel, suma, max, respondidas: valores.length };
}
