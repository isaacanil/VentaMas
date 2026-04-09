import pkg from 'enquirer';
const { Input, Select } = pkg;
import { consola } from 'consola';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const ESLINT_EXTENSIONS = 'js,jsx,ts,tsx';
const STYLELINT_GLOB = '{src,functions}/**/*.{css,scss,js,jsx,ts,tsx}';

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
}

const LINT_TARGETS = {
  fast: {
    label: 'Lint rápido (oxlint)',
    needsPaths: false,
  },
  all: {
    label: 'Lint completo (web + functions + styles)',
    needsPaths: false,
  },
  'web:fix': {
    label: 'Lint web con fix',
    needsPaths: false,
  },
  path: {
    label: 'Lint por ruta/archivo (rápido)',
    needsPaths: true,
  },
  'path:typed': {
    label: 'Lint por ruta/archivo (typed, más estricto)',
    needsPaths: true,
  },
  'path:fix': {
    label: 'Lint por ruta/archivo con fix',
    needsPaths: true,
  },
  functions: {
    label: 'Lint functions',
    needsPaths: false,
  },
  'functions:fix': {
    label: 'Lint functions con fix',
    needsPaths: false,
  },
  'styles:fix': {
    label: 'Stylelint con fix',
    needsPaths: false,
  },
};

const LINT_ALIASES = {
  quick: 'fast',
  full: 'all',
  typed: 'path:typed',
  fix: 'path:fix',
  styles: 'styles:fix',
};

function parseArgs(argv) {
  let target = null;
  let help = false;
  let inPassthrough = false;
  const passthrough = [];

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

    if (!arg.startsWith('-') && !target) {
      target = arg;
      continue;
    }

    passthrough.push(arg);
  }

  return { target, help, passthrough };
}

function usage() {
  const targets = Object.entries(LINT_TARGETS)
    .map(([key, cfg]) => `  - ${key.padEnd(14)} ${cfg.label}`)
    .join('\n');

  return [
    'Usage:',
    '  node tools/lint.js [target] [-- ...args]',
    '',
    'Targets:',
    targets,
    '',
    'Aliases:',
    '  quick -> fast',
    '  full  -> all',
    '  typed -> path:typed',
    '  fix   -> path:fix',
    '  styles -> styles:fix',
    '',
    'Examples:',
    '  npm run lint',
    '  npm run lint -- --help',
    '  npm run lint -- path src/router/routes/loaders/accessLoaders.ts',
    '  npm run lint -- typed src/utils/menuAccess.ts src/router/routes/paths/Authorizations.tsx',
    '  npm run lint -- functions',
    '  npm run lint -- styles',
  ].join('\n');
}

async function promptTarget() {
  const select = new Select({
    name: 'target',
    message: 'Selecciona el tipo de lint',
    choices: [
      ...Object.entries(LINT_TARGETS).map(([value, cfg]) => ({
        name: value,
        message: `${cfg.label} (${value})`,
        value,
      })),
      { name: 'help', message: 'Ver ayuda / ejemplos', value: 'help' },
      { name: 'exit', message: 'Salir', value: 'exit' },
    ],
  });
  return await select.run();
}

async function promptPaths() {
  const input = new Input({
    name: 'paths',
    message: 'Rutas/archivos a lint (separados por espacio)',
    initial: 'src',
  });
  const raw = await input.run();
  return raw
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
      ...options,
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function runOrExit(command, args, options = {}) {
  consola.info(`Running: ${command} ${args.join(' ')}`);
  const startedAt = Date.now();
  const code = await runCommand(command, args, options);
  const duration = formatDuration(Date.now() - startedAt);
  if (code !== 0) {
    consola.error(`Command failed after ${duration}: ${command}`);
    process.exit(code);
  }
  consola.success(`Finished in ${duration}: ${command}`);
}

function buildEslintArgs({ fix = false, paths = [] } = {}) {
  const args = ['--ext', ESLINT_EXTENSIONS];
  if (paths.length > 0) {
    args.push(...paths);
  } else {
    args.push('.');
  }
  if (fix) {
    args.push('--fix');
  }
  return args;
}

async function runLintTarget(target, args) {
  switch (target) {
    case 'fast':
      await runOrExit('oxlint', ['src', 'functions/src', '-f', 'stylish']);
      return;
    case 'all':
      await runOrExit('eslint', buildEslintArgs());
      await runOrExit('npm', ['--prefix', 'functions', 'run', 'lint']);
      await runOrExit('stylelint', [STYLELINT_GLOB]);
      return;
    case 'web:fix':
      await runOrExit('eslint', buildEslintArgs({ fix: true }));
      return;
    case 'path':
      await runOrExit('eslint', buildEslintArgs({ paths: args }));
      return;
    case 'path:typed':
      await runOrExit('eslint', buildEslintArgs({ paths: args }), {
        env: { ...process.env, ESLINT_TYPED: 'true' },
      });
      return;
    case 'path:fix':
      await runOrExit('eslint', buildEslintArgs({ fix: true, paths: args }));
      return;
    case 'functions':
      await runOrExit('npm', ['--prefix', 'functions', 'run', 'lint']);
      return;
    case 'functions:fix':
      await runOrExit('npm', ['--prefix', 'functions', 'run', 'lint:fix']);
      return;
    case 'styles:fix':
      await runOrExit('stylelint', [STYLELINT_GLOB, '--fix']);
      return;
    default:
      consola.error(`Unsupported lint target "${target}".`);
      process.exit(1);
  }
}

function normalizeTarget(value) {
  if (!value) return null;
  const normalized = LINT_ALIASES[value] ?? value;
  return LINT_TARGETS[normalized] ? normalized : null;
}

async function main() {
  const { target: rawTarget, help, passthrough } = parseArgs(process.argv.slice(2));

  if (help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const canPrompt = isInteractive();
  let target = normalizeTarget(rawTarget);

  if (!target) {
    if (rawTarget) {
      consola.error(`Unknown lint target "${rawTarget}".`);
      process.stdout.write(`\n${usage()}\n`);
      process.exit(1);
    }

    if (!canPrompt) {
      process.stdout.write(`${usage()}\n`);
      process.exit(1);
    }

    while (!target) {
      const selected = await promptTarget();
      if (selected === 'help') {
        process.stdout.write(`\n${usage()}\n\n`);
        continue;
      }
      if (selected === 'exit') {
        process.exit(0);
      }
      target = normalizeTarget(selected);
    }
  }

  const cfg = LINT_TARGETS[target];
  let args = [...passthrough];
  if (cfg.needsPaths && args.length === 0) {
    if (!canPrompt) {
      consola.error(`Target "${target}" requiere rutas/archivos.`);
      process.stdout.write(`\n${usage()}\n`);
      process.exit(1);
    }
    args = await promptPaths();
  }

  consola.box({
    title: 'Lint Tool',
    message: `Modo: ${cfg.label}`,
    style: { padding: 1, borderColor: 'cyan', borderStyle: 'double' },
  });
  await runLintTarget(target, args);
}

main().catch((err) => {
  if (err !== '') {
    consola.error('An error occurred:', err);
  }
  process.exit(0);
});
