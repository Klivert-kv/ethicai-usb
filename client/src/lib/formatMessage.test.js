import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMessage, parseInline } from './formatMessage.js';

test('negrita y código en línea', () => {
  assert.deepEqual(parseInline('Usa **range** con `len(x)`.'), [
    { type: 'text', value: 'Usa ' },
    { type: 'bold', value: 'range' },
    { type: 'text', value: ' con ' },
    { type: 'code', value: 'len(x)' },
    { type: 'text', value: '.' },
  ]);
});

test('bloques de código, listas y párrafos', () => {
  const blocks = parseMessage('Mira:\n\n```python\nfor i in range(3):\n    print(i)\n```\n- uno\n- dos\n\n1. a\n2. b');
  assert.deepEqual(
    blocks.map((b) => b.type),
    ['paragraph', 'code', 'list', 'list'],
  );
  assert.equal(blocks[1].lang, 'python');
  assert.equal(blocks[1].content, 'for i in range(3):\n    print(i)');
  assert.equal(blocks[2].ordered, false);
  assert.equal(blocks[3].ordered, true);
});

test('el HTML del modelo se conserva como texto (no se interpreta)', () => {
  const blocks = parseMessage('<img src=x onerror=alert(1)><script>alert(1)</script>');
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[0].lines[0][0].type, 'text');
  assert.equal(blocks[0].lines[0][0].value, '<img src=x onerror=alert(1)><script>alert(1)</script>');
});

test('bloque de código sin cerrar no rompe el resto', () => {
  const blocks = parseMessage('```js\nconst a = 1;');
  assert.equal(blocks[0].type, 'code');
  assert.equal(blocks[0].content, 'const a = 1;');
});
