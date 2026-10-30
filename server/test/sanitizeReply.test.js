import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeReply } from '../src/services/sanitizeReply.js';

test('quita la planificación en inglés del caso real reportado', () => {
  const raw =
    'We should respond with brief. Ask a question.En `range(1, 10)` ¿qué valores esperas que aparezcan?\nSi lo iteras, ¿verás o no el número 10?';
  assert.equal(
    sanitizeReply(raw),
    'En `range(1, 10)` ¿qué valores esperas que aparezcan?\nSi lo iteras, ¿verás o no el número 10?',
  );
});

test('quita otras variantes de notas iniciales', () => {
  assert.equal(sanitizeReply('The user asks about keys. We need to explain.\nUna clave primaria identifica cada fila.'), 'Una clave primaria identifica cada fila.');
  assert.equal(sanitizeReply("Let's answer concisely: ¿Qué sabes de bucles?"), '¿Qué sabes de bucles?');
});

test('formato harmony: conserva solo el mensaje final', () => {
  assert.equal(sanitizeReply('analysisWe think about it.assistantfinal¡Buena pregunta! ¿Qué sabes?'), '¡Buena pregunta! ¿Qué sabes?');
  assert.equal(
    sanitizeReply('<|channel|>analysis<|message|>plan<|end|><|channel|>final<|message|>Hola, ¿empezamos?'),
    'Hola, ¿empezamos?',
  );
});

test('no toca respuestas normales en español (aunque empiecen parecido)', () => {
  const ok = [
    'Una clave primaria identifica de forma única cada fila. ¿Qué crees que hace una foránea?',
    'No exactamente: range(1, 10) llega hasta el 9.',
    'En Python, `range` no incluye el límite superior.',
    'Ok, veamos tu código paso a paso.',
    'Usa la función len() para contar elementos.',
  ];
  for (const t of ok) assert.equal(sanitizeReply(t), t);
});

test('si solo hay razonamiento, queda vacío (el backend responde error, no lo muestra)', () => {
  assert.equal(sanitizeReply('We should ask a question. Keep it short.'), '');
});
