import pkg from 'enquirer';
const { Confirm, Input, Password, Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const FIREBASE_CLI_ARGS = ['-y', 'firebase-tools@latest'];

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function parseArgs(argv) {
  let env = null;
  let forceBuild = null; // true | false | null
  let help = false;
  let printOnly = false;
  const passthrough = [];
  let inPassthrough = false;

  for (const a of argv) {
    if (inPassthrough) {
      passthrough.push(a);
      continue;
    }

    if (a === '--') {
      inPassthrough = true;
      continue;
    }

    if (a === '--help' || a === '-h') {
      help = true;
      continue;
    }

    if (a === '--dry-run' || a === '--print') {
      printOnly = true;
      continue;
    }

    if (a === '--build') {
      forceBuild = true;
      continue;
    }
    if (a === '--no-build') {
      forceBuild = false;
      continue;
    }

    if (!a.startsWith('-') && !env) {
      env = a;
      continue;
    }

    passthrough.push(a);
  }

  return { env, forceBuild, help, passthrough, printOnly };
}

function usage() {
  return [
    'Usage:',
    '  node tools/deploy.js <prod|staging|prod:functions|staging:functions|beta|vercel> [--build|--no-build|--dry-run] [function names or firebase args]',
    '',
    'Examples:',
    '  npm run deploy',
    '  npm run deploy -- --help',
    '  npm run deploy -- staging',
    '  npm run deploy -- staging:functions:all',
    '  npm run deploy -- staging:functions reserveCreditNoteNcf,createBusiness',
    '  npm run deploy -- prod:functions reserveCreditNoteNcf',
    '  npm run deploy -- staging:functions reserveCreditNoteNcf --dry-run',
    '  npm run deploy -- prod --no-build',
  ].join('\n');
}

const DEPLOYS = {
  staging: {
    label: 'Firebase staging hosting (ventamax-staging)',
    environment: 'staging',
    projectAlias: 'staging',
    projectId: 'ventamax-staging',
    buildScript: 'build:staging',
    cmd: 'npx',
    args: [
      ...FIREBASE_CLI_ARGS,
      'deploy',
      '--project',
      'staging',
      '--only',
      'hosting:staging',
    ],
    requiresDist: true,
  },
  'staging:functions': {
    label: 'Firebase staging functions especificas (ventamax-staging)',
    environment: 'staging',
    projectAlias: 'staging',
    projectId: 'ventamax-staging',
    cmd: 'npx',
    args: [...FIREBASE_CLI_ARGS, 'deploy', '--project', 'staging'],
    requiresDist: false,
    requiresFunctionNames: true,
  },
  'staging:functions:all': {
    label: 'Firebase staging todas las functions (ventamax-staging)',
    environment: 'staging',
    projectAlias: 'staging',
    projectId: 'ventamax-staging',
    cmd: 'npx',
    args: [
      ...FIREBASE_CLI_ARGS,
      'deploy',
      '--project',
      'staging',
      '--only',
      'functions',
    ],
    requiresDist: false,
    requiredSecrets: ['GISYS_FACT_CLIENT_TOKEN'],
  },
  prod: {
    label: 'Firebase produccion hosting (ventamaxpos)',
    environment: 'prod',
    projectAlias: 'prod',
    projectId: 'ventamaxpos',
    buildScript: 'build:prod',
    cmd: 'npx',
    args: [
      ...FIREBASE_CLI_ARGS,
      'deploy',
      '--project',
      'prod',
      '--only',
      'hosting:prod',
    ],
    requiresDist: true,
    productionGuard: true,
  },
  'prod:functions': {
    label: 'Firebase produccion functions especificas (ventamaxpos)',
    environment: 'prod',
    projectAlias: 'prod',
    projectId: 'ventamaxpos',
    cmd: 'npx',
    args: [...FIREBASE_CLI_ARGS, 'deploy', '--project', 'prod'],
    requiresDist: false,
    requiresFunctionNames: true,
    productionGuard: true,
  },
  beta: {
    label: 'Firebase prod hosting channel: beta (ventamaxpos)',
    environment: 'prod',
    projectAlias: 'prod',
    projectId: 'ventamaxpos',
    buildScript: 'build:prod',
    cmd: 'npx',
    args: [
      ...FIREBASE_CLI_ARGS,
      'hosting:channel:deploy',
      'beta',
      '--project',
      'prod',
    ],
    requiresDist: true,
    productionGuard: true,
  },
  vercel: {
    label: 'Vercel --prod',
    environment: 'external',
    buildScript: 'build:prod',
    cmd: 'vercel',
    args: ['--prod'],
    requiresDist: false,
    productionGuard: true,
  },
};

function distLooksBuilt() {
  try {
    return fs.existsSync(path.join(ROOT_DIR, 'dist', 'index.html'));
  } catch {
    return false;
  }
}

async function confirm(message, initial = true) {
  const prompt = new Confirm({ name: 'confirm', message, initial });
  return await prompt.run();
}

async function input(message) {
  const prompt = new Input({ name: 'input', message });
  return await prompt.run();
}

async function password(message) {
  const prompt = new Password({ name: 'password', message });
  return await prompt.run();
}

async function promptDeploySelection() {
  const choices = Object.entries(DEPLOYS).map(([env, cfg]) => ({
    name: env,
    message: cfg.label,
  }));

  choices.push(
    { name: 'help', message: 'Ver ayuda / ejemplos' },
    { name: 'exit', message: 'Salir' },
  );

  const prompt = new Select({
    name: 'deploySelection',
    message: 'Selecciona el despliegue',
    choices,
  });

  return await prompt.run();
}

async function promptBuildMode({ buildScript }) {
  if (!buildScript) return 'no-build';

  const prompt = new Select({
    name: 'buildMode',
    message: `Como quieres proceder con el build? (script: npm run ${buildScript})`,
    choices: [
      { name: 'build', message: 'Con build (recomendado)' },
      { name: 'no-build', message: 'Sin build' },
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'back', message: 'Volver al menu anterior' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

function hasOnlyArg(args) {
  return args.includes('--only') || args.some((arg) => arg.startsWith('--only='));
}

function normalizeFunctionTargets(rawNames) {
  return rawNames
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => (name.startsWith('functions:') ? name : `functions:${name}`))
    .join(',');
}

async function resolveDeployArgs(cfg, passthrough, canPrompt) {
  if (!cfg.requiresFunctionNames) {
    return [...cfg.args, ...passthrough];
  }

  if (hasOnlyArg(passthrough)) {
    return [...cfg.args, ...passthrough];
  }

  const functionNameArgs = passthrough.filter((arg) => !arg.startsWith('-'));
  const flagArgs = passthrough.filter((arg) => arg.startsWith('-'));
  let rawNames = functionNameArgs.join(',');

  if (!rawNames && canPrompt) {
    rawNames = await input(
      'Funciones a desplegar (coma separada, sin "functions:" si prefieres)',
    );
  }

  const only = normalizeFunctionTargets(rawNames || '');
  if (!only) {
    consola.error('Debes indicar funciones especificas. Deploy all functions bloqueado.');
    consola.info('Ejemplo: npm run deploy -- staging:functions createInvoiceV2');
    process.exit(1);
  }

  return [...cfg.args, '--only', only, ...flagArgs];
}

async function assertProductionGuard(cfg, canPrompt) {
  if (!cfg.productionGuard) return;

  const expected = 'PROD';
  if (!canPrompt) {
    if (process.env.CONFIRM_PROD_DEPLOY === expected) return;
    consola.error(
      'Deploy a produccion bloqueado. Define CONFIRM_PROD_DEPLOY=PROD para modo no interactivo.',
    );
    process.exit(1);
  }

  const typed = await input(
    `Destino produccion (${cfg.projectId}). Escribe ${expected} para continuar`,
  );

  if (typed !== expected) {
    consola.warn('Deploy a produccion cancelado.');
    process.exit(0);
  }
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: options.input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
      shell: true,
    });

    if (options.input && child.stdin) {
      child.stdin.end(`${options.input}\n`);
    }

    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function runOrExit(command, args, options = {}) {
  consola.info(`Running: ${command} ${args.join(' ')}`);
  const code = await runCommand(command, args, options);
  if (code !== 0) {
    process.exit(code);
  }
}

async function ensureDeploySecrets(cfg, canPrompt) {
  if (!Array.isArray(cfg.requiredSecrets) || cfg.requiredSecrets.length === 0) {
    return;
  }

  for (const secretName of cfg.requiredSecrets) {
    let secretValue = process.env[secretName];

    if (!secretValue && canPrompt) {
      const shouldSet = await confirm(
        `Actualizar secret ${secretName} antes del deploy?`,
        true,
      );
      if (!shouldSet) {
        consola.warn(
          `${secretName} no actualizado. Firebase puede bloquear el deploy si no existe en ${cfg.projectId}.`,
        );
        continue;
      }

      secretValue = await password(`Valor para ${secretName}`);
    }

    if (!secretValue) {
      consola.error(
        `Falta ${secretName}. Define env var ${secretName} o ejecuta en modo interactivo.`,
      );
      process.exit(1);
    }

    await runOrExit('npx', [
      ...FIREBASE_CLI_ARGS,
      'functions:secrets:set',
      secretName,
      '--project',
      cfg.projectId || cfg.projectAlias,
    ], {
      input: secretValue,
    });
  }
}

async function main() {
  let { env, forceBuild, help, passthrough, printOnly } = parseArgs(
    process.argv.slice(2),
  );

  if (help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const canPrompt = isInteractive();
  if (!env) {
    if (!canPrompt) {
      process.stdout.write(`${usage()}\n`);
      process.exit(1);
    }

    while (!env) {
      const selectedEnv = await promptDeploySelection();
      if (selectedEnv === 'help') {
        process.stdout.write(`\n${usage()}\n\n`);
        continue;
      }
      if (selectedEnv === 'exit') {
        process.exit(0);
      }
      if (!selectedEnv || typeof selectedEnv !== 'string' || !DEPLOYS[selectedEnv]) {
        continue;
      }

      let buildResolved = false;
      while (!buildResolved) {
        const buildSelection = await promptBuildMode({
          buildScript: DEPLOYS[selectedEnv].buildScript,
        });
        if (buildSelection === 'help') {
          process.stdout.write(`\n${usage()}\n\n`);
          continue;
        }
        if (buildSelection === 'exit') {
          process.exit(0);
        }
        if (buildSelection === 'back') {
          break;
        }
        if (buildSelection === 'build' || buildSelection === 'no-build') {
          env = selectedEnv;
          forceBuild = buildSelection === 'build';
          buildResolved = true;
        }
      }
    }
  }

  const cfg = DEPLOYS[env];
  if (!cfg) {
    consola.error(`Unknown deploy environment "${env}".`);
    process.stdout.write(`\n${usage()}\n`);
    process.exit(1);
  }

  const deployArgs = await resolveDeployArgs(cfg, passthrough, canPrompt);

  consola.box({
    title: 'Deploy',
    message: [
      `Target: ${cfg.label}`,
      cfg.projectAlias ? `Project alias: ${cfg.projectAlias}` : null,
      cfg.projectId ? `Project id: ${cfg.projectId}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    style: { padding: 1, borderColor: 'cyan', borderStyle: 'double' },
  });

  if (printOnly) {
    consola.info(`Build script: ${cfg.buildScript || '(none)'}`);
    consola.info(`Command: ${cfg.cmd} ${deployArgs.join(' ')}`);
    process.exit(0);
  }

  await assertProductionGuard(cfg, canPrompt);

  let shouldBuild =
    forceBuild ??
    (cfg.buildScript && canPrompt
      ? await confirm(`Run "npm run ${cfg.buildScript}" before deploy?`)
      : Boolean(cfg.buildScript));

  if (!shouldBuild && cfg.requiresDist && !distLooksBuilt()) {
    if (!canPrompt) {
      consola.error('dist/index.html not found and build disabled (non-interactive). Aborting.');
      process.exit(1);
    }

    const buildNow = await confirm(
      'dist/index.html not found. Run build now (recommended)?',
      true,
    );
    shouldBuild = buildNow;
  }

  if (shouldBuild && cfg.buildScript) {
    await runOrExit('npm', ['run', cfg.buildScript]);
  } else if (cfg.buildScript) {
    consola.warn('Skipping build.');
  }

  await ensureDeploySecrets(cfg, canPrompt);

  await runOrExit(cfg.cmd, deployArgs);
}

main().catch((err) => {
  if (err !== '') {
    // Enquirer throws empty string on Ctrl+C
    consola.error('An error occurred:', err);
  }
  process.exit(0);
});
