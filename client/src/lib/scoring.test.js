import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RETOS } from '../data/retos.js';
import { PREGUNTAS, HABITOS, TEMAS } from '../data/quiz.js';
import { scoreChallenge, summarizeLab } from './labScoring.js';
import { scoreQuiz, estimateDependency } from './quizScoring.js';

const errorSegs = (r) => r.errores.map((e) => e.segmentoId);

test('datos del laboratorio: 3 retos, 2–3 errores cada uno, ids estables y segmentos existentes', () => {
  assert.equal(RETOS.length, 3);
  const ids = new Set();
  for (const r of RETOS) {
    assert.ok(r.errores.length >= 2 && r.errores.length <= 3, r.id);
    const segIds = new Set(r.segmentos.map((s) => s.id));
    for (const e of r.errores) {
      assert.ok(segIds.has(e.segmentoId), `${e.id} apunta a un segmento inexistente`);
      assert.ok(e.explicacion && e.verificacion && e.tipo);
      assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
      ids.add(e.id);
    }
    assert.equal(new Set(errorSegs(r)).size, r.errores.length, 'dos errores en el mismo segmento');
    assert.ok(r.solucion);
  }
});

test('laboratorio: todo correcto = 100', () => {
  for (const r of RETOS) {
    const s = scoreChallenge(r, errorSegs(r));
    assert.equal(s.puntaje, 100);
    assert.equal(s.omitidos.length, 0);
    assert.equal(s.falsosPositivos.length, 0);
  }
});

test('laboratorio: nada seleccionado = 0 y todos los errores omitidos', () => {
  const s = scoreChallenge(RETOS[0], []);
  assert.equal(s.puntaje, 0);
  assert.equal(s.omitidos.length, RETOS[0].errores.length);
});

test('laboratorio: marcar TODAS las frases no da ventaja', () => {
  for (const r of RETOS) {
    const todas = scoreChallenge(r, r.segmentos.map((x) => x.id));
    const soloUno = scoreChallenge(r, [errorSegs(r)[0]]);
    assert.ok(todas.puntaje <= soloUno.puntaje, `${r.id}: marcar todo (${todas.puntaje}) supera a un acierto (${soloUno.puntaje})`);
  }
});

test('laboratorio: fórmula exacta con aciertos y falsos positivos', () => {
  const r = RETOS[0]; // 3 errores
  const correcta = r.segmentos.find((x) => !errorSegs(r).includes(x.id)).id;
  // 2 aciertos, 1 falso positivo → 2 − 0,5 = 1,5 → 1,5/3 = 50
  const s = scoreChallenge(r, [errorSegs(r)[0], errorSegs(r)[1], correcta]);
  assert.equal(s.puntos, 1.5);
  assert.equal(s.puntaje, 50);
  assert.deepEqual(s.falsosPositivos, [correcta]);
});

test('laboratorio: ignora ids desconocidos y es determinista', () => {
  const r = RETOS[1];
  const a = scoreChallenge(r, ['no-existe', errorSegs(r)[0]]);
  const b = scoreChallenge(r, ['no-existe', errorSegs(r)[0]]);
  assert.deepEqual(a, b);
  assert.equal(a.falsosPositivos.length, 0);
  assert.equal(a.puntaje, 50);
});

test('resumen del laboratorio', () => {
  const res = { a: scoreChallenge(RETOS[0], errorSegs(RETOS[0])), b: scoreChallenge(RETOS[1], []) };
  assert.deepEqual(summarizeLab(res), { completados: 2, promedio: 50, encontrados: 3, totalErrores: 5 });
  assert.equal(summarizeLab({}).completados, 0);
});

test('cuestionario: 5 preguntas, respuesta correcta válida y tema con recomendación', () => {
  assert.equal(PREGUNTAS.length, 5);
  for (const p of PREGUNTAS) {
    assert.ok(p.opciones.some((o) => o.id === p.correcta), p.id);
    assert.ok(TEMAS[p.tema], `tema sin recomendación: ${p.tema}`);
  }
});

test('cuestionario: todo correcto', () => {
  const resp = Object.fromEntries(PREGUNTAS.map((p) => [p.id, p.correcta]));
  const r = scoreQuiz(PREGUNTAS, resp);
  assert.equal(r.aciertos, 5);
  assert.equal(r.porcentaje, 100);
  assert.deepEqual(r.temasRefuerzo, []);
});

test('cuestionario: resultados por tema, refuerzo y exceso de confianza', () => {
  const resp = Object.fromEntries(PREGUNTAS.map((p) => [p.id, p.correcta]));
  resp.q4 = 'a'; // fallo en Uso crítico de la IA
  const r = scoreQuiz(PREGUNTAS, resp, { q4: 'alta', q1: 'alta' });
  assert.equal(r.aciertos, 4);
  assert.equal(r.porcentaje, 80);
  const ia = r.porTema.find((t) => t.tema === 'Uso crítico de la IA');
  assert.deepEqual([ia.aciertos, ia.total, ia.porcentaje, ia.necesitaRefuerzo], [1, 2, 50, true]);
  assert.deepEqual(r.temasRefuerzo, ['Uso crítico de la IA']);
  assert.deepEqual(r.excesoConfianza, ['q4']);
});

test('dependencia: no se estima sin las 3 respuestas y la nota baja NO la determina', () => {
  assert.equal(estimateDependency(HABITOS, {}).nivel, null);
  assert.equal(estimateDependency(HABITOS, { h1: 2, h2: 2 }).nivel, null);
  // Nota 0 en el cuestionario no cambia nada: la función ni siquiera la recibe.
  assert.equal(estimateDependency(HABITOS, { h1: 0, h2: 0, h3: 0 }).nivel, 'bajo');
});

test('dependencia: umbrales transparentes', () => {
  const lvl = (a, b, c) => estimateDependency(HABITOS, { h1: a, h2: b, h3: c }).nivel;
  assert.equal(lvl(0, 0, 1), 'bajo');
  assert.equal(lvl(1, 1, 0), 'medio');
  assert.equal(lvl(1, 1, 1), 'medio');
  assert.equal(lvl(2, 1, 1), 'alto');
  assert.equal(lvl(2, 2, 2), 'alto');
});
