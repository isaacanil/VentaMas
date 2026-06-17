import pkg from 'enquirer';
const { Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const ALLOW_ALL_FUNCTIONS_DEPLOY_ENV = 'ALLOW_ALL_FUNCTIONS_DEPLOY';
const ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE = '1';

function isAllFunctionsDeployAllowed() {
  return process.env[ALLOW_ALL_FUNCTIONS_DEPLOY_ENV] === ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE;
}

const PROJECT_ENVIRONMENTS = {
  staging: {
    label: 'Staging (ventamax-staging)',
    actions: [
      {
        name: 'deploy:staging:all',
        message: 'Deploy staging: hosting + todas las functions',
        command: 'deploy',
        args: ['staging:all'],
        requiresAllFunctionsDeployGuard: true,
      },
      {
        name: 'deploy:staging',
        message: 'Deploy staging: hosting',
        command: 'deploy',
        args: ['staging'],
      },
      {
        name: 'deploy:staging:functions',
        message: 'Deploy staging: functions especificas',
        command: 'deploy',
        args: ['staging:functions'],
      },
      {
        name: 'deploy:staging:functions:all',
        message: 'Deploy staging: todas las functions',
        command: 'deploy',
        args: ['staging:functions:all'],
        requiresAllFunctionsDeployGuard: true,
      },
      {
        name: 'sync:indexes:prod-to-staging',
        message: 'Sync indices: prod -> staging',
        command: 'sync',
        args: ['indexes:prod-to-staging'],
      },
      {
        name: 'sync:business:prod-to-staging',
        message: 'Sync negocio: prod -> staging',
        command: 'sync',
        args: ['business:prod-to-staging'],
      },
    ],
  },
  prod: {
    label: 'Produccion (ventamaxpos)',
    actions: [
      {
        name: 'deploy:prod',
        message: 'Deploy prod: hosting',
        command: 'deploy',
        args: ['prod'],
      },
      {
        name: 'deploy:prod:functions',
        message: 'Deploy prod: functions especificas',
        command: 'deploy',
        args: ['prod:functions'],
      },
      {
        name: 'deploy:beta',
        message: 'Deploy prod: hosting channel beta',
        command: 'deploy',
        args: ['beta'],
      },
      {
        name: 'deploy:vercel',
        message: 'Deploy externo: Vercel --prod',
        command: 'deploy',
        args: ['vercel'],
      },
      {
        name: 'sync:indexes:staging-to-prod',
        message: 'Sync indices: staging -> prod',
        command: 'sync',
        args: ['indexes:staging-to-prod'],
      },
    ],
  },
};

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function usage() {
  const examples = [
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
  ];

  if (isAllFunctionsDeployAllowed()) {
    examples.push('  npm run project -- deploy staging:all');
  } else {
    examples.push(
      '',
      `Staging all-functions deploy targets are hidden and blocked unless ${ALLOW_ALL_FUNCTIONS_DEPLOY_ENV}=${ALLOW_ALL_FUNCTIONS_DEPLOY_VALUE}.`,
      'Use the normal scoped path instead: npm run project -- deploy staging:functions nombreDeFuncion',
    );
  }

  return examples.join('\n');
}

async function promptProjectEnvironment() {
  const prompt = new Select({
    name: 'projectEnvironment',
    message: 'Selecciona ambiente del proyecto',
    choices: [
      ...Object.entries(PROJECT_ENVIRONMENTS).map(([environment, cfg]) => ({
        name: environment,
        message: cfg.label,
      })),
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

async function promptProjectAction(environment) {
  const prompt = new Select({
    name: 'projectAction',
    message: `Selecciona operacion para ${PROJECT_ENVIRONMENTS[environment].label}`,
    choices: [
      ...PROJECT_ENVIRONMENTS[environment].actions
        .filter(
          (action) =>
            !action.requiresAllFunctionsDeployGuard ||
            isAllFunctionsDeployAllowed(),
        )
        .map((action) => ({
          name: action.name,
          message: action.message,
        })),
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'back', message: 'Volver a ambientes' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

function resolveProjectMenuAction(selection) {
  for (const cfg of Object.values(PROJECT_ENVIRONMENTS)) {
    const action = cfg.actions.find((item) => item.name === selection);
    if (action) {
      return {
        action: action.command,
        passthrough: action.args,
      };
    }
  }

  return null;
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

    const selectedEnvironment = await promptProjectEnvironment();
    if (selectedEnvironment === 'help') {
      process.stdout.write(`\n${usage()}\n\n`);
      continue;
    }
    if (selectedEnvironment === 'exit') {
      process.exit(0);
    }
    if (!PROJECT_ENVIRONMENTS[selectedEnvironment]) {
      continue;
    }

    while (!action) {
      const selectedAction = await promptProjectAction(selectedEnvironment);
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

      const resolved = resolveProjectMenuAction(selectedAction);
      if (resolved) {
        action = resolved.action;
        passthrough = resolved.passthrough;
      }
    }
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
