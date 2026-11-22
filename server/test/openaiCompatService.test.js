import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAICompatClient } from '../src/services/openaiCompatService.js';
import { createLlmClient } from '../src/services/llmClient.js';
import { OllamaError, ERROR_CODES } from '../src/services/ollamaService.js';
import { loadConfig } from '../src/config.js';
import { startFakeOllama as startFakeServer, sendJson } from './helpers.js';

const MODEL = 'openai/gpt-oss-20b';
const KEY = 'gsk_prueba_123';
const msgs = [{ role: 'user', content: 'Hola' }];

/** Respuesta con la forma de /chat/completions de Groq para gpt-oss (incluye reasoning). */
function completion(content, reasoning = 'RAZONAMIENTO-PRIVADO-NO-MOSTRAR') {
  return {
    id: 'chatcmpl-1',
    object: 'chat.completion',
    model: MODEL,
    choices: [{ index: 0, message: { role: 'assistant', content, reasoning }, finish_reason: 'stop' }],
  };
}

test('envía modelo, mensajes, stream:false, reasoning_effort y la clave; descarta reasoning', async () => {
  const fake = await startFakeServer((req, res) => {
    fake.auth = req.headers.authorization;
    sendJson(res, 200, completion('¿Qué sabes ya del tema?'));
  });
  try {
    const client = createOpenAICompatClient({ baseUrl: fake.url, apiKey: KEY, model: MODEL, reasoningEffort: 'low' });
    const result = await client.chat(msgs);
    assert.equal(result.content, '¿Qué sabes ya del tema?');
    assert.equal(result.doneReason, 'stop');
    assert.ok(!JSON.stringify(result).includes('RAZONAMIENTO-PRIVADO'));
    assert.equal(fake.auth, `Bearer ${KEY}`);
    const sent = fake.requests[0];
    assert.equal(sent.url, '/chat/completions');
    assert.equal(sent.body.model, MODEL);
    assert.equal(sent.body.stream, false);
    assert.equal(sent.body.reasoning_effort, 'low');
    assert.deepEqual(sent.body.messages, msgs);
  } finally {
    await fake.close();
  }
});

test('limpia notas de planificación en inglés filtradas en content (D-01)', async () => {
  const fake = await startFakeServer((_req, res) =>
    sendJson(res, 200, completion('We should ask a question. ¿Qué parte de la función te cuesta más?')),
  );
  try {
    const client = createOpenAICompatClient({ baseUrl: fake.url, apiKey: KEY, model: MODEL });
    assert.equal((await client.chat(msgs)).content, '¿Qué parte de la función te cuesta más?');
  } finally {
    await fake.close();
  }
});

for (const [status, code] of [
  [401, ERROR_CODES.AUTH],
  [402, ERROR_CODES.REMOTE_RATE_LIMIT],
  [404, ERROR_CODES.MODEL_NOT_FOUND],
  [413, ERROR_CODES.REMOTE_RATE_LIMIT],
  [429, ERROR_CODES.REMOTE_RATE_LIMIT],
  [503, ERROR_CODES.REMOTE_ERROR],
  [418, ERROR_CODES.HTTP_ERROR],
]) {
  test(`HTTP ${status} → ${code} (sin filtrar la clave)`, async () => {
    const fake = await startFakeServer((_req, res) => sendJson(res, status, { error: { message: 'algo' } }));
    try {
      const client = createOpenAICompatClient({ baseUrl: fake.url, apiKey: KEY, model: MODEL });
      await assert.rejects(
        client.chat(msgs),
        (e) => e instanceof OllamaError && e.code === code && !JSON.stringify(e).includes(KEY) && !e.message.includes(KEY),
      );
    } finally {
      await fake.close();
    }
  });
}

test('sin conexión → OLLAMA_UNREACHABLE con mensaje que no menciona Ollama', async () => {
  const client = createOpenAICompatClient({ baseUrl: 'http://127.0.0.1:1', apiKey: KEY, model: MODEL });
  await assert.rejects(client.chat(msgs), (e) => e.code === ERROR_CODES.UNREACHABLE && !/ollama/i.test(e.message));
});

test('content vacío y solo reasoning → OLLAMA_EMPTY_RESPONSE', async () => {
  const fake = await startFakeServer((_req, res) => sendJson(res, 200, completion(null, 'pensando…')));
  try {
    const client = createOpenAICompatClient({ baseUrl: fake.url, apiKey: KEY, model: MODEL });
    await assert.rejects(client.chat(msgs), (e) => e.code === ERROR_CODES.EMPTY_RESPONSE && !e.message.includes('pensando'));
  } finally {
    await fake.close();
  }
});

test('si el modelo rechaza reasoning_effort con 400, reintenta una vez sin él', async () => {
  const fake = await startFakeServer((_req, res, body) => {
    if (body.reasoning_effort) return sendJson(res, 400, { error: { message: 'reasoning_effort is not supported' } });
    return sendJson(res, 200, completion('ok sin reasoning'));
  });
  try {
    const client = createOpenAICompatClient({ baseUrl: fake.url, apiKey: KEY, model: MODEL, reasoningEffort: 'low' });
    assert.equal((await client.chat(msgs)).content, 'ok sin reasoning');
    assert.equal(fake.requests.length, 2);
    assert.equal(fake.requests[1].body.reasoning_effort, undefined);
  } finally {
    await fake.close();
  }
});

test('status(): detecta el modelo en /models', async () => {
  const fake = await startFakeServer((_req, res) => sendJson(res, 200, { data: [{ id: MODEL }, { id: 'otro' }] }));
  try {
    const client = createOpenAICompatClient({ baseUrl: fake.url, apiKey: KEY, model: MODEL });
    assert.deepEqual(await client.status(), { reachable: true, modelAvailable: true, model: MODEL });
    assert.equal(fake.requests[0].url, '/models');
  } finally {
    await fake.close();
  }
});

test('config: LLM_PROVIDER=openai usa Groq y gpt-oss-20b por defecto; sin variable se mantiene Ollama', () => {
  const groq = loadConfig({ LLM_PROVIDER: 'openai', LLM_API_KEY: KEY, LLM_REASONING_EFFORT: 'LOW' });
  assert.equal(groq.llmBaseUrl, 'https://api.groq.com/openai/v1');
  assert.equal(groq.model, MODEL);
  assert.equal(groq.llmReasoningEffort, 'low');
  assert.equal(createLlmClient(groq).model, MODEL);
  const def = loadConfig({});
  assert.equal(def.llmProvider, 'ollama');
  assert.equal(def.model, 'gpt-oss:20b-cloud');
});
