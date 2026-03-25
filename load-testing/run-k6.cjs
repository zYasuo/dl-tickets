const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const winK6 = String.raw`C:\Program Files\k6\k6.exe`;

function resolveK6() {
  if (process.platform === 'win32' && fs.existsSync(winK6)) {
    return winK6;
  }
  const r = spawnSync('k6', ['version'], { stdio: 'ignore' });
  if (r.status === 0) return 'k6';
  return null;
}

const k6 = resolveK6();
if (!k6) {
  console.error(
    'k6 not found. Install with: winget install GrafanaLabs.k6\nThen reopen the terminal or add k6 to PATH.',
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
let scriptPath = path.join(__dirname, 'create-tickets.k6.js');
let k6Rest = argv;

if (argv[0] === 'race') {
  scriptPath = path.join(__dirname, 'race-ticket-update.k6.js');
  k6Rest = argv.slice(1);
}

const r = spawnSync(k6, ['run', scriptPath, ...k6Rest], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
