import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const required = [
  'manifest.json',
  'versions.json',
  'src-kanbanrpm/main.ts',
  'src-kanbanrpm/styles.css',
  'scripts/build.mjs',
  'scripts/package.mjs',
  'scripts/smoke.mjs',
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    throw new Error(`Missing required file: ${rel}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.id !== 'kanban-rpm') throw new Error('manifest.id must be kanban-rpm');
if (manifest.name !== 'KanbanRPM') throw new Error('manifest.name must be KanbanRPM');

const versions = JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'));
if (versions[manifest.version] !== manifest.minAppVersion) {
  throw new Error('versions.json must map manifest.version to manifest.minAppVersion');
}

const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

const result = spawnSync(process.execPath, [tscBin, '--noEmit'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('KanbanRPM static checks passed');
