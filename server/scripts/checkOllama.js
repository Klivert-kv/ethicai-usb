/**
 * Verificación de la integración de ESTA aplicación con Ollama.
 * Usa el mismo cliente y el mismo prompt que el tutor, sin pasar por la interfaz.
 *   npm run check:ollama
 */
import { loadConfig } from '../src/config.js';
import { OllamaError } from '../src/services/ollamaService.js';
import { createLlmClient } from '../src/services/llmClient.js';
import { buildSystemPrompt } from '../src/prompts/tutorSystemPrompt.js';

const config = loadConfig();
const client = createLlmClient(config);

console.log(`\nComprobando ${config.model} (${config.llmProvider}) …`);

const status = await client.status();
console.log(`  Servicio alcanzable: ${status.reachable ? 'sí' : 'NO'}`);
console.log(`  Modelo registrado: ${status.modelAvailable ? 'sí' : 'NO'}`);
if (!status.reachable) {
  console.log('\n  → Revisa la conexión a internet (o abre Ollama si LLM_PROVIDER=ollama).\n');
  process.exit(1);
}

const started = Date.now();
try {
  const result = await client.chat([
    { role: 'system', content: buildSystemPrompt({ hintLevel: 1 }) },
    { role: 'user', content: '¿Qué es una variable en programación?' },
  ]);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`  Respuesta del tutor en ${secs} s:\n`);
  console.log(result.content.split('\n').map((l) => `    ${l}`).join('\n'));
  console.log('\n  ✔ Integración correcta.\n');
} catch (err) {
  if (err instanceof OllamaError) {
    console.log(`\n  ✘ ${err.code}: ${err.message}`);
    if (err.detail) console.log(`    Detalle: ${err.detail}`);
  } else {
    console.log(`\n  ✘ Error inesperado: ${err?.message}`);
  }
  process.exit(1);
}
