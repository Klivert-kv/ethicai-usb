import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOllamaClient, OllamaError, ERROR_CODES } from '../src/services/ollamaService.js';
import { startFakeOllama, sendJson, gptOssReply } from './helpers.js';

const MODEL = 'gpt-oss:20b-cloud';
const msgs = [{ role: 'user', content: 'Hola' }];

test('envía modelo, mensajes y stream:false; devuelve content y descarta thinking', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 200, gptOssReply('¿Qué sabes ya del tema?')));
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL, think: 'low' });
    const result = await client.chat(msgs);
    assert.equal(result.content, '¿Qué sabes ya del tema?');
    assert.equal(result.doneReason, 'stop');
    assert.ok(!('thinking' in result));
    assert.ok(!JSON.stringify(result).includes('RAZONAMIENTO-PRIVADO'));
    const sent = fake.requests[0];
    assert.equal(sent.url, '/api/chat');
    assert.equal(sent.body.model, MODEL);
    assert.equal(sent.body.stream, false);
    assert.equal(sent.body.think, 'low');
    assert.deepEqual(sent.body.messages, msgs);
  } finally {
    await fake.close();
  }
});

test('sin conexión → OLLAMA_UNREACHABLE', async () => {
  const client = createOllamaClient({ baseUrl: 'http://127.0.0.1:1', model: MODEL });
  await assert.rejects(client.chat(msgs), (e) => e instanceof OllamaError && e.code === ERROR_CODES.UNREACHABLE);
});

test('tiempo de espera → OLLAMA_TIMEOUT', async () => {
  const fake = await startFakeOllama(async (_req, res) => {
    await new Promise((r) => setTimeout(r, 400));
    sendJson(res, 200, gptOssReply('tarde'));
  });
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL, timeoutMs: 100 });
    await assert.rejects(client.chat(msgs), (e) => e.code === ERROR_CODES.TIMEOUT && e.httpStatus === 504);
  } finally {
    await fake.close();
  }
});

for (const [status, code] of [
  [401, ERROR_CODES.AUTH],
  [403, ERROR_CODES.AUTH],
  [404, ERROR_CODES.MODEL_NOT_FOUND],
  [429, ERROR_CODES.REMOTE_RATE_LIMIT],
  [500, ERROR_CODES.REMOTE_ERROR],
  [502, ERROR_CODES.REMOTE_ERROR],
  [418, ERROR_CODES.HTTP_ERROR],
]) {
  test(`HTTP ${status} → ${code}`, async () => {
    const fake = await startFakeOllama((_req, res) => sendJson(res, status, { error: 'algo' }));
    try {
      const client = createOllamaClient({ baseUrl: fake.url, model: MODEL });
      await assert.rejects(client.chat(msgs), (e) => e.code === code);
    } finally {
      await fake.close();
    }
  });
}

test('JSON inválido → OLLAMA_INVALID_RESPONSE', async () => {
  const fake = await startFakeOllama((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('esto no es json');
  });
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL });
    await assert.rejects(client.chat(msgs), (e) => e.code === ERROR_CODES.INVALID_RESPONSE);
  } finally {
    await fake.close();
  }
});

test('estructura inesperada → OLLAMA_INVALID_RESPONSE', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 200, { done: true }));
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL });
    await assert.rejects(client.chat(msgs), (e) => e.code === ERROR_CODES.INVALID_RESPONSE);
  } finally {
    await fake.close();
  }
});

test('solo thinking y content vacío → OLLAMA_EMPTY_RESPONSE (no se muestra el thinking)', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 200, gptOssReply('   ', 'pensando…')));
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL });
    await assert.rejects(client.chat(msgs), (e) => e.code === ERROR_CODES.EMPTY_RESPONSE && !e.message.includes('pensando'));
  } finally {
    await fake.close();
  }
});

test('si Ollama rechaza "think" con 400, reintenta una vez sin él y con el mismo modelo', async () => {
  const fake = await startFakeOllama((_req, res, body) => {
    if (body.think) return sendJson(res, 400, { error: 'think value "low" is not supported' });
    return sendJson(res, 200, gptOssReply('ok sin think'));
  });
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL, think: 'low' });
    const r = await client.chat(msgs);
    assert.equal(r.content, 'ok sin think');
    assert.equal(fake.requests.length, 2);
    assert.equal(fake.requests[1].body.model, MODEL);
    assert.equal(fake.requests[1].body.think, undefined);
  } finally {
    await fake.close();
  }
});

test('status(): detecta el modelo registrado en /api/tags', async () => {
  const fake = await startFakeOllama((_req, res) =>
    sendJson(res, 200, { models: [{ name: MODEL, model: MODEL, remote_host: 'https://ollama.com' }] }),
  );
  try {
    const client = createOllamaClient({ baseUrl: fake.url, model: MODEL });
    assert.deepEqual(await client.status(), { reachable: true, modelAvailable: true, model: MODEL });
  } finally {
    await fake.close();
  }
});

test('status(): sin Ollama → reachable false', async () => {
  const client = createOllamaClient({ baseUrl: 'http://127.0.0.1:1', model: MODEL });
  const s = await client.status();
  assert.equal(s.reachable, false);
});
