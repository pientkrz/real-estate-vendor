/**
 * Walidator pliku agents.json
 * Uruchom: node scripts/validate-agents.mjs
 * Nie wymaga żadnych dodatkowych pakietów – działa na czystym Node.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateAgents } from './validate-agents-core.mjs';

function readEnv(projectRoot) {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
  return env;
}

const projectRoot = path.resolve(import.meta.dirname, '..');
const env = readEnv(projectRoot);
const relPath = env.AGENTS_FILE_PATH || './src/data/agents.json';
const filePath = path.resolve(projectRoot, relPath);

console.log('─'.repeat(60));
console.log(' Walidator listy agentów — Global S Home');
console.log('─'.repeat(60));
console.log(`\n► Plik: ${filePath}`);

if (!fs.existsSync(filePath)) {
  console.error(`  ✗  Nie znaleziono pliku: ${filePath}`);
  console.error('  ✗  Sprawdź ścieżkę AGENTS_FILE_PATH w pliku .env');
  process.exit(1);
}
console.log('  ✓  Plik istnieje');

let data;
try {
  data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
} catch (e) {
  console.error(`  ✗  Plik zawiera błąd składni JSON: ${e.message}`);
  console.error('  ✗  Wskazówka: sprawdź czy wszystkie pola są w cudzysłowach, a elementy oddzielone przecinkami.');
  process.exit(1);
}
console.log('  ✓  Składnia JSON jest poprawna');

const { valid, errors } = validateAgents(data);

if (Array.isArray(data)) {
  console.log(`  ✓  Znaleziono ${data.length} agenta/agentów`);
}

console.log('\n► Sprawdzanie poszczególnych agentów:');
if (errors.length > 0) {
  for (const e of errors) console.error(`  ✗  ${e}`);
} else {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      console.log(`  ✓  Agent #${i + 1} (${data[i].name}): wszystkie pola są poprawne`);
    }
  }
}

console.log('\n' + '─'.repeat(60));
if (valid) {
  console.log(' ✓  Plik jest poprawny i gotowy do użycia w aplikacji.');
} else {
  console.error(' ✗  Znaleziono błędy — popraw je przed uruchomieniem aplikacji.');
  process.exit(1);
}
console.log('─'.repeat(60) + '\n');
