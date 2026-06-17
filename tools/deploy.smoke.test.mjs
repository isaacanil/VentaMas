import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DEPLOY_SCRIPT = path.join(ROOT_DIR, 'tools', 'deploy.js');

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

function runDeploy(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [DEPLOY_SCRIPT, ...args], {
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

test('dry-run scopes staging functions to named function targets', async () => {
  const result = await runDeploy([
    'staging:functions',
    'reserveCreditNoteNcf,createBusiness',
    '--dry-run',
  ]);

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Build script: \(none\)/);
  assert.match(
    result.output,
    /--only functions:reserveCreditNoteNcf,functions:createBusiness/,
  );
  assert.doesNotMatch(result.output, /--only functions(?:\s|$)/);
});

test('dry-run preserves explicit scoped --only function targets', async () => {
  const result = await runDeploy([
    'staging:functions',
    '--only',
    'functions:reserveCreditNoteNcf',
    '--dry-run',
  ]);

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /--only functions:reserveCreditNoteNcf/);
});

test('dry-run preserves equals-form scoped --only function targets', async () => {
  const result = await runDeploy([
    'staging:functions',
    '--only=functions:reserveCreditNoteNcf',
    '--dry-run',
  ]);

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /--only=functions:reserveCreditNoteNcf/);
});

test('dry-run blocks non-functions --only targets from scoped functions target', async () => {
  const result = await runDeploy([
    'staging:functions',
    '--only',
    'hosting:staging',
    '--dry-run',
  ]);

  assert.equal(result.code, 1, result.output);
  assert.match(
    result.output,
    /solo aceptan --only functions:<nombreDeFuncion>/,
  );
});

test('dry-run blocks equals-form non-functions --only targets from scoped functions target', async () => {
  const result = await runDeploy([
    'staging:functions',
    '--only=hosting:staging',
    '--dry-run',
  ]);

  assert.equal(result.code, 1, result.output);
  assert.match(
    result.output,
    /solo aceptan --only functions:<nombreDeFuncion>/,
  );
});

test('dry-run blocks staging all-functions target without explicit guard', async () => {
  const result = await runDeploy(['staging:all', '--dry-run']);

  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Deploy all Cloud Functions bloqueado/);
  assert.match(result.output, /ALLOW_ALL_FUNCTIONS_DEPLOY=1/);
});

test('dry-run blocks passthrough all-functions --only target', async () => {
  const result = await runDeploy([
    'staging:functions',
    '--only',
    'functions',
    '--dry-run',
  ]);

  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Deploy all Cloud Functions bloqueado/);
});

test('dry-run blocks equals-form passthrough all-functions --only target', async () => {
  const result = await runDeploy([
    'staging:functions',
    '--only=functions',
    '--dry-run',
  ]);

  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Deploy all Cloud Functions bloqueado/);
});

test('dry-run scopes prod functions to named function targets', async () => {
  const result = await runDeploy([
    'prod:functions',
    'reserveCreditNoteNcf',
    '--dry-run',
  ]);

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Build script: \(none\)/);
  assert.match(result.output, /--project prod --only functions:reserveCreditNoteNcf/);
});

test('dry-run allows all-functions target only with explicit guard', async () => {
  const result = await runDeploy(['staging:all', '--dry-run'], {
    ALLOW_ALL_FUNCTIONS_DEPLOY: '1',
  });

  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Build script: build:staging/);
  assert.match(result.output, /--only hosting:staging,functions/);
});
