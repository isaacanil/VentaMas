import pkg from 'enquirer';
const { Confirm, Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

function parseArgs(argv) {
  let env = null;
  let forceBuild = null; // true | false | null
  let help = false;
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

    // Any extra flags/args are forwarded to the underlying deploy command.
    passthrough.push(a);
  }

  return { env, forceBuild, help, passthrough };
}

function usage() {
  return [
    'Usage:',
    '  node tools/deploy.js <prod|staging|beta|vercel> [--build|--no-build] [...args forwarded to firebase/vercel]',
    '',
    'Examples:',
    '  npm run deploy',
    '  npm run deploy -- --help',
    '  npm run deploy -- prod --no-build',
    '  npm run deploy -- prod --build -- --project <firebase-project-id>',
  ].join('\n');
}

const DEPLOYS = {
  prod: {
    label: 'Firebase hosting:prod',
    buildScript: 'build:compiler',
    cmd: 'firebase',
    args: ['deploy', '--only', 'hosting:prod'],
    requiresDist: true,
  },
  staging: {
    label: 'Firebase hosting:staging',
    buildScript: 'build',
    cmd: 'firebase',
    args: ['deploy', '--only', 'hosting:staging'],
    requiresDist: true,
  },
  beta: {
    label: 'Firebase hosting channel: beta',
    buildScript: 'build',
    cmd: 'firebase',
    args: ['hosting:channel:deploy', 'beta'],
    requiresDist: true,
  },
  vercel: {
    label: 'Vercel --prod',
    buildScript: 'build:compiler',
    cmd: 'vercel',
    args: ['--prod'],
    requiresDist: false,
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
  const prompt = new Select({
    name: 'buildMode',
    message: `¿Cómo quieres proceder con el build? (script: npm run ${buildScript})`,
    choices: [
      { name: 'build', message: 'Con build (recomendado)' },
      { name: 'no-build', message: 'Sin build' },
      { name: 'help', message: 'Ver ayuda / ejemplos' },
      { name: 'back', message: 'Volver al menú anterior' },
      { name: 'exit', message: 'Salir' },
    ],
  });

  return await prompt.run();
}

async function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function runOrExit(command, args) {
  consola.info(`Running: ${command} ${args.join(' ')}`);
  const code = await runCommand(command, args);
  if (code !== 0) {
    process.exit(code);
  }
}

async function main() {
  let { env, forceBuild, help, passthrough } = parseArgs(process.argv.slice(2));

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

  consola.box({
    title: 'Deploy',
    message: `Target: ${cfg.label}`,
    style: { padding: 1, borderColor: 'cyan', borderStyle: 'double' },
  });

  let shouldBuild =
    forceBuild ?? (canPrompt ? await confirm(`Run "npm run ${cfg.buildScript}" before deploy?`) : true);

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

  if (shouldBuild) {
    await runOrExit('npm', ['run', cfg.buildScript]);
  } else {
    consola.warn('Skipping build.');
  }

  await runOrExit(cfg.cmd, [...cfg.args, ...passthrough]);
}

main().catch((err) => {
  if (err !== '') {
    // Enquirer throws empty string on Ctrl+C
    consola.error('An error occurred:', err);
  }
  process.exit(0);
});
