import pkg from 'enquirer';
const { Input, Select } = pkg;
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const NPM = 'npm';

const TARGETS = {
  staging: {
    label: 'Staging seguro (ventamax-staging)',
    mode: 'staging',
    projectId: 'ventamax-staging',
    envFiles: ['.env.staging.local', '.env.staging'],
  },
  prod: {
    label: 'Produccion real (ventamaxpos)',
    mode: 'production',
    projectId: 'ventamaxpos',
    envFiles: ['.env.production.local', '.env.production', '.env'],
    productionGuard: true,
  },
};

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function parseArgs(argv) {
  let target = null;
  let help = false;
  let dryRun = false;
  const passthrough = [];
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

    if (arg === '--dry-run' || arg === '--print') {
      dryRun = true;
      continue;
    }

    if (!arg.startsWith('-') && !target) {
      target = normalizeTarget(arg);
      continue;
    }

    passthrough.push(arg);
  }

  return { target, help, dryRun, passthrough };
}

function normalizeTarget(value) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['staging', 'stage', 'stg'].includes(normalized)) return 'staging';
  if (['prod', 'production', 'produccion'].includes(normalized)) return 'prod';
  return normalized;
}

function usage() {
  return [
    'Uso:',
    '  npm run dev',
    '  npm run dev:staging',
    '  npm run dev:prod',
    '  npm run dev -- staging -- --host 127.0.0.1 --port 5173',
    '  npm run dev -- prod -- --port 5174',
    '',
    'Regla:',
    '  staging usa ventamax-staging por defecto.',
    '  prod usa datos reales y requiere escribir PROD.',
  ].join('\n');
}

async function promptTarget() {
  const prompt = new Select({
    name: 'devTarget',
    message: 'Selecciona entorno local',
    initial: 0,
    choices: [
      { name: 'staging', message: TARGETS.staging.label },
      { name: 'prod', message: TARGETS.prod.label },
      { name: 'help', message: 'Ver ayuda' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

function hasAnyEnvFile(files) {
  return files.some((file) => fs.existsSync(path.join(ROOT_DIR, file)));
}

function validateTarget(targetKey, cfg) {
  if (!TARGETS[targetKey]) {
    throw new Error(`Entorno no soportado: ${targetKey}`);
  }

  if (!hasAnyEnvFile(cfg.envFiles)) {
    throw new Error(
      `Falta archivo env para ${targetKey}. Esperado uno de: ${cfg.envFiles.join(', ')}`,
    );
  }
}

async function confirmProduction() {
  if (process.env.CONFIRM_PROD_DEV === 'PROD') return true;

  if (!isInteractive()) {
    throw new Error(
      'Produccion bloqueada en modo no interactivo. Usa CONFIRM_PROD_DEV=PROD si realmente quieres abrir prod.',
    );
  }

  console.log('');
  console.log('PELIGRO: dev contra produccion usa Firestore/Auth/Storage/Functions reales.');
  console.log('Proyecto: ventamaxpos');
  const prompt = new Input({
    name: 'confirmation',
    message: 'Escribe PROD para continuar',
  });
  const answer = await prompt.run();

  if (answer !== 'PROD') {
    throw new Error('Produccion cancelada.');
  }

  return true;
}

function buildViteArgs(cfg, passthrough) {
  return ['exec', '--', 'vite', '--mode', cfg.mode, ...passthrough];
}

function quoteWindowsArg(arg) {
  const value = String(arg);
  if (/^[A-Za-z0-9_:/=.,@+-]+$/.test(value)) return value;
  return `"${value.replace(/(["^&|<>])/g, '^$1')}"`;
}

function formatCommand(command, args) {
  if (process.platform === 'win32') {
    return [command, ...args].map(quoteWindowsArg).join(' ');
  }

  return [command, ...args].join(' ');
}

function getSpawnSpec(command, args) {
  if (process.platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', formatCommand(command, args)],
    };
  }

  return { command, args };
}

function printRun(targetKey, cfg, args) {
  console.log('');
  console.log(`Entorno: ${targetKey}`);
  console.log(`Firebase project: ${cfg.projectId}`);
  console.log(`Vite mode: ${cfg.mode}`);
  console.log(`Comando: ${formatCommand(NPM, args)}`);
  console.log('');
}

function run(args, env) {
  const spawnSpec = getSpawnSpec(NPM, args);
  const child = spawn(spawnSpec.command, spawnSpec.args, {
    cwd: ROOT_DIR,
    env,
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (error) => {
    console.error(`No se pudo iniciar Vite: ${error.message || error}`);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  let targetKey = args.target;

  while (!targetKey) {
    targetKey = await promptTarget();
    if (targetKey === 'help') {
      console.log('');
      console.log(usage());
      console.log('');
      targetKey = null;
      continue;
    }
    if (targetKey === 'exit') return;
  }

  const cfg = TARGETS[targetKey];
  validateTarget(targetKey, cfg);

  if (cfg.productionGuard && !args.dryRun) {
    await confirmProduction();
  }

  const viteArgs = buildViteArgs(cfg, args.passthrough);
  printRun(targetKey, cfg, viteArgs);

  if (args.dryRun) return;

  run(viteArgs, {
    ...process.env,
    VENTAMAS_DEV_TARGET: targetKey,
    VITE_VENTAMAS_TARGET_ENV: targetKey,
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
