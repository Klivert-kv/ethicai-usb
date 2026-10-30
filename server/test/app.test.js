import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { startFakeOllama, sendJson, gptOssReply, startApp } from './helpers.js';

function configFor(ollamaUrl, extra = {}) {
  return {
    ...loadConfig({}),
    ollamaBaseUrl: ollamaUrl,
    clientDistDir: '', // las pruebas de API no sirven el frontend
    ...extra,
  };
}

const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('POST /api/tutor/chat: respuesta real del modelo sin thinking, con prompt de sistema y modelo configurado', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 200, gptOssReply('¿Qué crees que hace `range`?')));
  const app = await startApp(createApp(configFor(fake.url)));
  try {
    const res = await post(`${app.url}/api/tutor/chat`, {
      messages: [{ role: 'user', content: 'Explícame range' }],
      hintLevel: 2,
      activity: 'Ejercicio de bucles',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(Object.keys(data).sort(), ['hintLevel', 'model', 'reply']);
    assert.equal(data.reply, '¿Qué crees que hace `range`?');
    assert.ok(!JSON.stringify(data).includes('RAZONAMIENTO-PRIVADO'));

    const sent = fake.requests[0].body;
    assert.equal(sent.model, 'gpt-oss:20b-cloud');
    assert.equal(sent.messages[0].role, 'system');
    assert.ok(sent.messages[0].content.includes('Nivel de ayuda 2'));
    assert.ok(sent.messages[0].content.includes('Ejercicio de bucles'));
    assert.deepEqual(sent.messages.at(-1), { role: 'user', content: 'Explícame range' });
  } finally {
    await app.close();
    await fake.close();
  }
});

test('Ollama caído → 503 con código OLLAMA_UNREACHABLE y mensaje claro', async () => {
  const app = await startApp(createApp(configFor('http://127.0.0.1:1')));
  try {
    const res = await post(`${app.url}/api/tutor/chat`, { messages: [{ role: 'user', content: 'hola' }] });
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.error.code, 'OLLAMA_UNREACHABLE');
    assert.match(data.error.message, /Ollama/);
  } finally {
    await app.close();
  }
});

test('modelo en la nube sin sesión (401) → OLLAMA_AUTH_REQUIRED', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 401, { error: 'unauthorized' }));
  const app = await startApp(createApp(configFor(fake.url)));
  try {
    const res = await post(`${app.url}/api/tutor/chat`, { messages: [{ role: 'user', content: 'hola' }] });
    const data = await res.json();
    assert.equal(data.error.code, 'OLLAMA_AUTH_REQUIRED');
    assert.match(data.error.message, /ollama signin/);
  } finally {
    await app.close();
    await fake.close();
  }
});

test('solicitud inválida → 400; JSON mal formado → 400', async () => {
  const app = await startApp(createApp(configFor('http://127.0.0.1:1')));
  try {
    const r1 = await post(`${app.url}/api/tutor/chat`, { messages: [{ role: 'user', content: '   ' }] });
    assert.equal(r1.status, 400);
    assert.equal((await r1.json()).error.code, 'INVALID_REQUEST');
    const r2 = await fetch(`${app.url}/api/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{mal',
    });
    assert.equal(r2.status, 400);
    assert.equal((await r2.json()).error.code, 'INVALID_JSON');
  } finally {
    await app.close();
  }
});

test('control de frecuencia: responde 429 al superar el límite', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 200, gptOssReply('ok')));
  const app = await startApp(createApp(configFor(fake.url, { tutorRateLimitPerMinute: 2 })));
  try {
    const body = { messages: [{ role: 'user', content: 'hola' }] };
    assert.equal((await post(`${app.url}/api/tutor/chat`, body)).status, 200);
    assert.equal((await post(`${app.url}/api/tutor/chat`, body)).status, 200);
    const third = await post(`${app.url}/api/tutor/chat`, body);
    assert.equal(third.status, 429);
    assert.equal((await third.json()).error.code, 'RATE_LIMITED');
  } finally {
    await app.close();
    await fake.close();
  }
});

test('CORS solo permite el origen configurado', async () => {
  const app = await startApp(createApp(configFor('http://127.0.0.1:1')));
  try {
    const ok = await fetch(`${app.url}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const other = await fetch(`${app.url}/api/health`, { headers: { Origin: 'http://evil.example' } });
    assert.notEqual(other.headers.get('access-control-allow-origin'), 'http://evil.example');
  } finally {
    await app.close();
  }
});

test('GET /api/tutor/status informa si el modelo está registrado', async () => {
  const fake = await startFakeOllama((_req, res) => sendJson(res, 200, { models: [{ name: 'gpt-oss:20b-cloud' }] }));
  const app = await startApp(createApp(configFor(fake.url)));
  try {
    const data = await (await fetch(`${app.url}/api/tutor/status`)).json();
    assert.equal(data.reachable, true);
    assert.equal(data.modelAvailable, true);
    assert.equal(data.hintLevels.length, 4);
  } finally {
    await app.close();
    await fake.close();
  }
});
