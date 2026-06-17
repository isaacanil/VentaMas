import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJECT_SCRIPT = path.join(ROOT_DIR, 'tools', 'project.js');

function buildEnv(overrides = {}) {
  const env = {
    ...process.env,
    CI: '1',
    FORCE_COLOR: '0',
    NO_COLOR: '1',
  };

  delete env.ALLOW_ALL_FUNCTIONS_DEPLOY;
  delete env.CONFIRM_PROD_DEPLOY;

  return { ...env, ...overrides };
}

function runProject(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [PROJECT_SCRIPT, ...args], {
      cwd: ROOT_DIR,
      env: buildEnv(env),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        output: `${stdout}${stderr}`,
      });
    });
  });
}

test('deploy staging:all --dry-run blocks broad deploys through project wrapper', async () => {
  const result = await runProject(['deploy', 'staging:all', '--dry-run']);

  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Deploy all Cloud Functions bloqueado/);
  assert.match(result.output, /ALLOW_ALL_FUNCTIONS_DEPLOY=1/);
});

test('deploy staging:functions <name> --dry-run allows scoped functions through project wrapper', async () => {
  const result = await runProject([
    'deploy',
    'staging:functions',
    'reserveCreditNoteNcf',
    '--dry-run',
  ]);

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Build script: \(none\)/);
  assert.match(result.output, /--only functions:reserveCreditNoteNcf/);
  assert.doesNotMatch(result.output, /--only functions(?:\s|$)/);
});

test('deploy prod:functions <name> blocks without production confirmation through project wrapper', async () => {
  const result = await runProject([
    'deploy',
    'prod:functions',
    'reserveCreditNoteNcf',
  ]);

  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Deploy a produccion bloqueado/);
  assert.match(result.output, /CONFIRM_PROD_DEPLOY=PROD/);
  assert.doesNotMatch(result.output, /Running: npx/);
});

test('help renders usage for project wrapper', async () => {
  const result = await runProject(['--help']);

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Usage:/);
  assert.match(result.output, /node tools\/project\.js deploy/);
  assert.match(
    result.output,
    /Use the normal scoped path instead: npm run project -- deploy staging:functions nombreDeFuncion/,
  );
});

test('non-interactive project wrapper without args prints usage and fails cleanly', async () => {
  const result = await runProject([]);

  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Usage:/);
  assert.doesNotMatch(result.output, /An error occurred/);
});
