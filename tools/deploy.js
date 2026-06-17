import pkg from 'enquirer';
const { Confirm, Input, Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const FIREBASE_CLI_ARGS = ['-y', 'firebase-tools@latest'];
const ALLOW_ALL_FUNCTIONS_DEPLOY_ENV = 'ALLOW_ALL_FUNCTIONS_DEPLOY';
const ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE = '1';

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function isAllFunctionsDeployAllowed() {
  return process.env[ALLOW_ALL_FUNCTIONS_DEPLOY_ENV] === ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE;
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
  const baseTargets = 'prod|staging|prod:functions|staging:functions|beta|vercel';
  const allFunctionsTargets = isAllFunctionsDeployAllowed()
    ? '|staging:all|staging:functions:all'
    : '';
  const examples = [
    'Usage:',
    '  node tools/deploy.js',
    `  node tools/deploy.js <${baseTargets}${allFunctionsTargets}> [--build|--no-build|--dry-run] [function names or firebase args]`,
    '',
    'Examples:',
    '  npm run deploy',
    '  npm run deploy -- --help',
    '  npm run deploy -- staging',
    '  npm run deploy -- staging:functions reserveCreditNoteNcf,createBusiness',
    '  npm run deploy -- prod:functions reserveCreditNoteNcf',
    '  npm run deploy -- staging:functions reserveCreditNoteNcf --dry-run',
    '  npm run deploy -- prod --no-build',
  ];

  if (isAllFunctionsDeployAllowed()) {
    examples.splice(
      8,
      0,
      '  npm run deploy -- staging:all',
      '  npm run deploy -- staging:functions:all',
    );
  } else {
    examples.push(
      '',
      `All-functions deploy targets are hidden and blocked unless ${ALLOW_ALL_FUNCTIONS_DEPLOY_ENV}=${ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE}.`,
      'Use a normal scoped path instead: npm run deploy -- staging:functions nombreDeFuncion (or prod:functions nombreDeFuncion).',
    );
  }

  return examples.join('\n');
}

const DEPLOY_ENVIRONMENTS = {
  staging: {
    label: 'Staging (ventamax-staging)',
    deploys: ['staging:all', 'staging', 'staging:functions', 'staging:functions:all'],
  },
  prod: {
    label: 'Produccion (ventamaxpos / externos)',
    deploys: ['prod', 'prod:functions', 'beta', 'vercel'],
  },
};

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
  'staging:all': {
    label: 'Firebase staging hosting + todas las functions (ventamax-staging)',
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
      'hosting:staging,functions',
    ],
    requiresDist: true,
    requiresAllFunctionsDeployGuard: true,
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
    requiresAllFunctionsDeployGuard: true,
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

async function promptDeployEnvironment() {
  const prompt = new Select({
    name: 'deployEnvironment',
    message: 'Selecciona ambiente de deploy',
    choices: [
      ...Object.entries(DEPLOY_ENVIRONMENTS).map(([env, cfg]) => ({
        name: env,
        message: cfg.label,
      })),
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

async function promptDeploySelection(environment) {
  const deployKeys = DEPLOY_ENVIRONMENTS[environment]?.deploys ?? [];
  const prompt = new Select({
    name: 'deploySelection',
    message: `Selecciona accion para ${DEPLOY_ENVIRONMENTS[environment].label}`,
    choices: [
      ...deployKeys
        .filter(
          (env) =>
            !DEPLOYS[env].requiresAllFunctionsDeployGuard ||
            isAllFunctionsDeployAllowed(),
        )
        .map((env) => ({
          name: env,
          message: DEPLOYS[env].label,
        })),
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'back', message: 'Volver a ambientes' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

function assertAllFunctionsDeployGuard(env, cfg, deployArgs = null) {
  const targetRequiresGuard = Boolean(cfg.requiresAllFunctionsDeployGuard);
  const argsRequireGuard = deployArgs
    ? deployArgsDeployAllFunctions(cfg, deployArgs)
    : false;

  if (
    (!targetRequiresGuard && !argsRequireGuard) ||
    isAllFunctionsDeployAllowed()
  ) {
    return;
  }

  consola.error(
    [
      `Deploy all Cloud Functions bloqueado para "${env}".`,
      `Define ${ALLOW_ALL_FUNCTIONS_DEPLOY_ENV}=${ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE} solo si quieres desplegar todas las Cloud Functions.`,
      `Camino normal: npm run deploy -- ${cfg.environment}:functions nombreDeFuncion`,
    ].join('\n'),
  );
  process.exit(1);
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

function getOnlyArgValues(args) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--only' && typeof args[index + 1] === 'string') {
      values.push(args[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith('--only=')) {
      values.push(arg.slice('--only='.length));
    }
  }
  return values;
}

function onlyArgDeploysAllFunctions(value) {
  return value
    .split(',')
    .map((target) => target.trim())
    .some((target) => target === 'functions');
}

function onlyArgHasNonFunctionTarget(value) {
  return value
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean)
    .some(
      (target) =>
        target !== 'functions' && !target.startsWith('functions:'),
    );
}

function deployArgsDeployAllFunctions(cfg, deployArgs) {
  if (!['prod', 'staging'].includes(cfg.environment)) return false;
  return getOnlyArgValues(deployArgs).some(onlyArgDeploysAllFunctions);
}

function assertScopedFunctionsOnlyTargets(passthrough) {
  const invalidOnly = getOnlyArgValues(passthrough).find(
    onlyArgHasNonFunctionTarget,
  );

  if (!invalidOnly) return;

  consola.error(
    'Los targets staging:functions/prod:functions solo aceptan --only functions:<nombreDeFuncion>.',
  );
  consola.info('Ejemplo: npm run deploy -- staging:functions --only functions:createInvoiceV2');
  process.exit(1);
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
    assertScopedFunctionsOnlyTargets(passthrough);
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
      const selectedEnvironment = await promptDeployEnvironment();
      if (selectedEnvironment === 'help') {
        process.stdout.write(`\n${usage()}\n\n`);
        continue;
      }
      if (selectedEnvironment === 'exit') {
        process.exit(0);
      }
      if (
        !selectedEnvironment ||
        typeof selectedEnvironment !== 'string' ||
        !DEPLOY_ENVIRONMENTS[selectedEnvironment]
      ) {
        continue;
      }

      let selectedEnv = null;
      while (!selectedEnv) {
        const selectedAction = await promptDeploySelection(selectedEnvironment);
        if (selectedAction === 'help') {
          process.stdout.write(`\n${usage()}\n\n`);
          continue;
        }
        if (selectedAction === 'exit') {
          process.exit(0);
        }
        if (selectedAction === 'back') {
          break;
        }
        if (!selectedAction || typeof selectedAction !== 'string' || !DEPLOYS[selectedAction]) {
          continue;
        }
        selectedEnv = selectedAction;
      }

      while (selectedEnv) {
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
          selectedEnv = null;
          break;
        }
        if (buildSelection === 'build' || buildSelection === 'no-build') {
          env = selectedEnv;
          forceBuild = buildSelection === 'build';
          break;
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

  assertAllFunctionsDeployGuard(env, cfg);

  const deployArgs = await resolveDeployArgs(cfg, passthrough, canPrompt);
  assertAllFunctionsDeployGuard(env, cfg, deployArgs);

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

  await runOrExit(cfg.cmd, deployArgs);
}

main().catch((err) => {
  if (err !== '') {
    // Enquirer throws empty string on Ctrl+C
    consola.error('An error occurred:', err);
  }
  process.exit(0);
});
