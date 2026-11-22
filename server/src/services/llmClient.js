import { createOllamaClient } from './ollamaService.js';
import { createOpenAICompatClient } from './openaiCompatService.js';

/** Elige el cliente del modelo: "openai" (Groq u otra API compatible) u "ollama" (predeterminado). */
export function createLlmClient(config) {
  if (config.llmProvider === 'openai') {
    return createOpenAICompatClient({
      baseUrl: config.llmBaseUrl,
      apiKey: config.llmApiKey,
      model: config.llmModel,
      reasoningEffort: config.llmReasoningEffort,
      timeoutMs: config.ollamaTimeoutMs,
    });
  }
  return createOllamaClient({
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
    think: config.ollamaThink,
    timeoutMs: config.ollamaTimeoutMs,
  });
}
