import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.js';
import { createApp } from './app.js';

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  const servesClient = fs.existsSync(path.join(config.clientDistDir, 'index.html'));
  console.log('');
  console.log('  EthicAI USB — servidor iniciado');
  console.log(`  API:     http://localhost:${config.port}/api/health`);
  if (servesClient) console.log(`  App:     http://localhost:${config.port}  (modo demostración)`);
  console.log(`  Modelo:  ${config.ollamaModel} vía ${config.ollamaBaseUrl}`);
  console.log(`  Razonamiento interno (think): ${config.ollamaThink || 'predeterminado'} — nunca se muestra al estudiante`);
  console.log('');
});
