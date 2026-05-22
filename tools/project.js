import pkg from 'enquirer';
const { Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function usage() {
  return [
    'Usage:',
    '  node tools/project.js',
    '  node tools/project.js sync [sync action/options]',
    '  node tools/project.js deploy [deploy action/options]',
    '',
    'Examples:',
    '  npm run project',
    '  npm run project -- sync',
    '  npm run project -- sync indexes:prod-to-staging --dry-run',
    '  npm run project -- deploy staging',
  ].join('\n');
}

async function promptProjectAction() {
  const prompt = new Select({
    name: 'projectAction',
    message: 'Selecciona una operacion del proyecto',
    choices: [
      {
        name: 'sync',
        message: 'Sincronizacion',
      },
      {
        name: 'deploy',
        message: 'Deploy',
      },
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      shell: false,
      stdio: 'inherit',
    });

    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const help = argv[0] === '--help' || argv[0] === '-h';

  if (help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  let action = argv[0] ?? null;
  let passthrough = action ? argv.slice(1) : [];
  const canPrompt = isInteractive();

  while (!action) {
    if (!canPrompt) {
      process.stdout.write(`${usage()}\n`);
      process.exit(1);
    }

    const selected = await promptProjectAction();
    if (selected === 'help') {
      process.stdout.write(`\n${usage()}\n\n`);
      continue;
    }
    if (selected === 'exit') {
      process.exit(0);
    }

    action = selected;
    passthrough = [];
  }

  if (action === 'sync') {
    const code = await runCommand(process.execPath, ['tools/sync.js', ...passthrough]);
    process.exit(code);
  }

  if (action === 'deploy') {
    const code = await runCommand(process.execPath, [
      'tools/deploy.js',
      ...passthrough,
    ]);
    process.exit(code);
  }

  consola.error(`Unknown project action "${action}".`);
  process.stdout.write(`\n${usage()}\n`);
  process.exit(1);
}

main().catch((err) => {
  if (err !== '') {
    consola.error('An error occurred:', err);
  }
  process.exit(1);
});
