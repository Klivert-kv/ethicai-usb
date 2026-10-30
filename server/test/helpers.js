import http from 'node:http';

/** Servidor HTTP falso que imita la API de Ollama para las pruebas. */
export async function startFakeOllama(handler) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : undefined;
    requests.push({ method: req.method, url: req.url, body });
    await handler(req, res, body);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((r) => server.close(r)),
  };
}

export function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/** Respuesta con la forma real observada de gpt-oss vía Ollama (incluye thinking). */
export function gptOssReply(content, thinking = 'RAZONAMIENTO-PRIVADO-NO-MOSTRAR') {
  return {
    model: 'gpt-oss:20b-cloud',
    created_at: new Date().toISOString(),
    message: { role: 'assistant', content, thinking },
    done: true,
    done_reason: 'stop',
  };
}

export async function startApp(app) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}
