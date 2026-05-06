import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const releaseDir = path.join(root, 'dist', `${manifest.id}-${manifest.version}`);
const vaultPluginDir = path.join(path.dirname(root), '.obsidian', 'plugins', manifest.id);

const build = spawnSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

if (build.status !== 0) process.exit(build.status ?? 1);

fs.rmSync(releaseDir, { recursive: true, force: true });
fs.mkdirSync(releaseDir, { recursive: true });

for (const file of ['main.js', 'manifest.json', 'styles.css']) {
  fs.copyFileSync(path.join(vaultPluginDir, file), path.join(releaseDir, file));
}

console.log(`KanbanRPM release bundle prepared at ${releaseDir}`);
