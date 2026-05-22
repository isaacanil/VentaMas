import pkg from 'enquirer';
const { Confirm, Input, Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const FIREBASE_CLI_ARGS = ['-y', 'firebase-tools@latest'];
const INDEXES_FILE = path.join(ROOT_DIR, 'firestore.indexes.json');

const INDEX_SYNC_PRESETS = {
  'indexes:prod-to-staging': {
    label: 'Firestore indexes: ventamaxpos -> ventamax-staging',
    from: 'ventamaxpos',
    to: 'ventamax-staging',
    deploy: true,
  },
  'indexes:staging-to-prod': {
    label: 'Firestore indexes: ventamax-staging -> ventamaxpos',
    from: 'ventamax-staging',
    to: 'ventamaxpos',
    deploy: true,
    productionGuard: true,
  },
};

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function usage() {
  return [
    'Usage:',
    '  node tools/sync.js <action> [options] [-- extra args]',
    '',
    'Actions:',
    '  indexes:prod-to-staging    Export indexes from ventamaxpos and deploy them to ventamax-staging.',
    '  indexes:staging-to-prod    Export indexes from ventamax-staging and deploy them to ventamaxpos. Requires guard.',
    '  indexes                    Custom source/target index sync. Requires --from and --to.',
    '  business:prod-to-staging   Run tools/copy-business-to-staging.mjs with passthrough args.',
    '',
    'Options for indexes:',
    '  --from=<projectId|alias>    Source Firebase project.',
    '  --to=<projectId|alias>      Target Firebase project.',
    '  --database=<databaseId>     Firestore database id. Defaults to (default).',
    '  --deploy                   Deploy indexes after writing firestore.indexes.json.',
    '  --no-deploy                Only refresh firestore.indexes.json.',
    '  --dry-run, --print         Print commands without writing or deploying.',
    '',
    'Examples:',
    '  npm run sync',
    '  npm run sync -- --help',
    '  npm run sync -- indexes:prod-to-staging',
    '  npm run sync -- indexes:prod-to-staging --dry-run',
    '  npm run sync -- indexes --from=ventamaxpos --to=ventamax-staging --deploy',
    '  npm run sync -- business:prod-to-staging -- --dry-run',
    '  npm run sync -- business:prod-to-staging -- --write',
  ].join('\n');
}

function parseArgs(argv) {
  const flags = {};
  const passthrough = [];
  let action = null;
  let help = false;
  let inPassthrough = false;

  for (const arg of argv) {
    if (inPassthrough) {
      passthrough.push(arg);
      continue;
    }

    if (arg === '--') {
      inPassthrough = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }

    if (arg === '--deploy') {
      flags.deploy = true;
      continue;
    }

    if (arg === '--no-deploy') {
      flags.deploy = false;
      continue;
    }

    if (arg === '--dry-run' || arg === '--print') {
      flags.dryRun = true;
      continue;
    }

    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      flags[match[1]] = match[2];
      continue;
    }

    if (!arg.startsWith('-') && !action) {
      action = arg;
      continue;
    }

    passthrough.push(arg);
  }

  return { action, flags, help, passthrough };
}

async function promptAction() {
  const prompt = new Select({
    name: 'syncSelection',
    message: 'Selecciona la sincronizacion',
    choices: [
      {
        name: 'indexes:prod-to-staging',
        message: 'Indices Firestore: ventamaxpos -> ventamax-staging',
      },
      {
        name: 'indexes:custom',
        message: 'Indices Firestore: origen/destino custom',
      },
      {
        name: 'business:prod-to-staging',
        message: 'Datos de negocio: ventamaxpos -> ventamax-staging',
      },
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

async function input(message, initial) {
  const prompt = new Input({ name: 'input', message, initial });
  return await prompt.run();
}

async function confirm(message, initial = true) {
  const prompt = new Confirm({ name: 'confirm', message, initial });
  return await prompt.run();
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const childCommand = resolveCommand(command);
    const spawnSpec = buildSpawnSpec(childCommand, args);
    let child;

    try {
      child = spawn(spawnSpec.command, spawnSpec.args, {
        cwd: ROOT_DIR,
        shell: false,
        stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      });
    } catch (err) {
      resolve({
        code: 1,
        stdout: '',
        stderr: err instanceof Error ? err.stack || err.message : String(err),
      });
      return;
    }

    let stdout = '';
    let stderr = '';

    if (options.capture) {
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', (err) => {
      resolve({
        code: 1,
        stdout,
        stderr: err instanceof Error ? err.stack || err.message : String(err),
      });
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function resolveCommand(command) {
  if (command === 'node') return process.execPath;
  if (process.platform === 'win32' && (command === 'npm' || command === 'npx')) {
    return `${command}.cmd`;
  }
  return command;
}

function buildSpawnSpec(command, args) {
  if (process.platform !== 'win32' || !command.endsWith('.cmd')) {
    return { command, args };
  }

  const commandLine = [command, ...args].map(quoteCmdArg).join(' ');
  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', commandLine],
  };
}

function quoteCmdArg(arg) {
  const value = String(arg);
  if (!/[\s"&|<>^]/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function runOrExit(command, args) {
  consola.info(`Running: ${command} ${args.join(' ')}`);
  const result = await runCommand(command, args);
  if (result.code !== 0) {
    process.exit(result.code);
  }
}

function extractFirstJsonObject(rawOutput) {
  const start = rawOutput.indexOf('{');
  if (start < 0) {
    throw new Error('No se encontro JSON en la salida del Firebase CLI.');
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let index = start; index < rawOutput.length; index += 1) {
    const char = rawOutput[index];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return rawOutput.slice(start, index + 1);
      }
    }
  }

  throw new Error('La salida del Firebase CLI no contiene un JSON completo.');
}

function normalizeIndexesSpec(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('El JSON de indices no tiene formato de objeto.');
  }

  return {
    indexes: Array.isArray(value.indexes) ? value.indexes : [],
    fieldOverrides: Array.isArray(value.fieldOverrides) ? value.fieldOverrides : [],
  };
}

function buildListIndexesArgs(projectId, database) {
  const args = [
    ...FIREBASE_CLI_ARGS,
    'firestore:indexes',
    '--project',
    projectId,
  ];

  if (database) {
    args.push('--database', database);
  }

  return args;
}

function buildDeployIndexesArgs(projectId) {
  return [
    ...FIREBASE_CLI_ARGS,
    'deploy',
    '--only',
    'firestore:indexes',
    '--project',
    projectId,
  ];
}

function isProductionProject(projectId) {
  return projectId === 'prod' || projectId === 'ventamaxpos';
}

async function assertProductionGuard(projectId, canPrompt) {
  if (!isProductionProject(projectId)) return;

  const expected = 'PROD';
  if (!canPrompt) {
    if (process.env.CONFIRM_PROD_SYNC === expected) return;
    consola.error(
      'Sincronizacion hacia produccion bloqueada. Define CONFIRM_PROD_SYNC=PROD para modo no interactivo.',
    );
    process.exit(1);
  }

  const typed = await input(
    `Destino produccion (${projectId}). Escribe ${expected} para continuar`,
  );

  if (typed !== expected) {
    consola.warn('Sincronizacion hacia produccion cancelada.');
    process.exit(0);
  }
}

async function resolveIndexConfig(action, flags, canPrompt) {
  const preset = INDEX_SYNC_PRESETS[action] ?? {};
  let from = flags.from || preset.from || null;
  let to = flags.to || preset.to || null;

  if (action === 'indexes:custom') {
    action = 'indexes';
  }

  if (action === 'indexes' && canPrompt) {
    from = from || (await input('Proyecto origen Firebase', 'ventamaxpos'));
    to = to || (await input('Proyecto destino Firebase', 'ventamax-staging'));
  }

  if (!from || !to) {
    consola.error('Debes indicar --from y --to para sincronizar indices custom.');
    process.stdout.write(`\n${usage()}\n`);
    process.exit(1);
  }

  const deploy =
    typeof flags.deploy === 'boolean'
      ? flags.deploy
      : typeof preset.deploy === 'boolean'
        ? preset.deploy
        : canPrompt
          ? await confirm(`Desplegar indices en ${to} despues de exportar?`, true)
          : false;

  return {
    from,
    to,
    database: flags.database || null,
    deploy,
    label: preset.label || `Firestore indexes: ${from} -> ${to}`,
  };
}

async function syncIndexes(action, flags, canPrompt) {
  const cfg = await resolveIndexConfig(action, flags, canPrompt);
  const listArgs = buildListIndexesArgs(cfg.from, cfg.database);
  const deployArgs = buildDeployIndexesArgs(cfg.to);

  consola.box({
    title: 'Sync Firebase',
    message: [
      cfg.label,
      `Source: ${cfg.from}`,
      `Target: ${cfg.to}`,
      cfg.database ? `Database: ${cfg.database}` : 'Database: (default)',
      `Local file: ${path.relative(ROOT_DIR, INDEXES_FILE)}`,
      `Deploy: ${cfg.deploy ? 'yes' : 'no'}`,
    ].join('\n'),
    style: { padding: 1, borderColor: 'cyan', borderStyle: 'double' },
  });

  if (flags.dryRun) {
    consola.info(`Export: npx ${listArgs.join(' ')}`);
    consola.info(`Write: ${path.relative(ROOT_DIR, INDEXES_FILE)}`);
    if (cfg.deploy) {
      consola.info(`Deploy: npx ${deployArgs.join(' ')}`);
    }
    return;
  }

  if (cfg.deploy) {
    await assertProductionGuard(cfg.to, canPrompt);
  }

  consola.info(`Exporting indexes from ${cfg.from}...`);
  const result = await runCommand('npx', listArgs, { capture: true });
  if (result.code !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.code);
  }

  const parsed = JSON.parse(extractFirstJsonObject(`${result.stdout}\n${result.stderr}`));
  const normalized = normalizeIndexesSpec(parsed);
  fs.writeFileSync(INDEXES_FILE, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  consola.success(
    `Wrote ${normalized.indexes.length} indexes and ${normalized.fieldOverrides.length} field overrides to firestore.indexes.json.`,
  );

  if (cfg.deploy) {
    await runOrExit('npx', deployArgs);
  }
}

async function runBusinessSync(flags, passthrough, canPrompt) {
  let args = ['tools/copy-business-to-staging.mjs', ...passthrough];

  if (args.length === 1 && canPrompt) {
    const mode = await new Select({
      name: 'businessSyncMode',
      message: 'Modo de sincronizacion de negocio',
      choices: [
        { name: '--dry-run', message: 'Dry-run: solo leer y resumir' },
        { name: '--write', message: 'Write: escribir en staging' },
        { name: 'exit', message: 'Salir' },
      ],
    }).run();

    if (mode === 'exit') process.exit(0);
    args = ['tools/copy-business-to-staging.mjs', mode];
  }

  if (!args.includes('--dry-run') && !args.includes('--write')) {
    args.push('--dry-run');
  }

  if (args.includes('--write')) {
    const proceed = canPrompt
      ? await confirm('Esto escribira datos de negocio en staging. Continuar?', false)
      : process.env.CONFIRM_STAGING_BUSINESS_SYNC === 'STAGING';

    if (!proceed) {
      consola.warn('Sincronizacion de negocio cancelada.');
      process.exit(0);
    }
  }

  if (flags.dryRun) {
    consola.info(`Run: node ${args.join(' ')}`);
    return;
  }

  await runOrExit('node', args);
}

async function main() {
  let { action, flags, help, passthrough } = parseArgs(process.argv.slice(2));

  if (help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const canPrompt = isInteractive();

  while (!action) {
    if (!canPrompt) {
      process.stdout.write(`${usage()}\n`);
      process.exit(1);
    }

    const selectedAction = await promptAction();
    if (selectedAction === 'help') {
      process.stdout.write(`\n${usage()}\n\n`);
      continue;
    }
    if (selectedAction === 'exit') {
      process.exit(0);
    }
    action = selectedAction;
  }

  if (
    action === 'indexes' ||
    action === 'indexes:custom' ||
    Object.prototype.hasOwnProperty.call(INDEX_SYNC_PRESETS, action)
  ) {
    await syncIndexes(action, flags, canPrompt);
    return;
  }

  if (action === 'business:prod-to-staging') {
    await runBusinessSync(flags, passthrough, canPrompt);
    return;
  }

  consola.error(`Unknown sync action "${action}".`);
  process.stdout.write(`\n${usage()}\n`);
  process.exit(1);
}

main().catch((err) => {
  if (err !== '') {
    consola.error('An error occurred:', err);
  }
  process.exit(1);
});
