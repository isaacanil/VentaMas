#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import net from 'node:net';
import { spawn } from 'node:child_process';
import enquirerPkg from 'enquirer';
const { Confirm } = enquirerPkg;

const MANAGED_PORTS = [4000, 4400, 4500, 5001, 8081, 9099, 9150, 5173, 5174, 5175, 5176];
const DEFAULT_PROJECT_ID = 'ventamaxpos';
const DEFAULT_FIRESTORE_HOST = '127.0.0.1:8081';
const DEFAULT_AUTH_HOST = '127.0.0.1:9099';
const DEFAULT_START_TIMEOUT_MS = 90_000;
const DEFAULT_POLL_INTERVAL_MS = 750;
const DEFAULT_JAVA_HOME =
  'C:\\Tools\\microsoft-jdk-21.0.10-windows-x64\\jdk-21.0.10+7';

const FIREBASE_BIN =
  process.platform === 'win32'
    ? path.resolve(process.cwd(), 'node_modules', '.bin', 'firebase.cmd')
    : path.resolve(process.cwd(), 'node_modules', '.bin', 'firebase');

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseCliArgs = (argv) => {
  const positional = [];
  const flags = {};

  for (const token of argv.slice(2)) {
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    const [rawKey, ...rest] = token.slice(2).split('=');
    const key = rawKey.trim();
    if (!key) continue;

    flags[key] = rest.length > 0 ? rest.join('=') : true;
  }

  return { positional, flags };
};

const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (value === true) return true;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const parseIntegerFlag = (value, fallback) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) return fallback;
  return Math.floor(normalized);
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const ensureLocalBinaries = async () => {
  if (!(await fileExists(FIREBASE_BIN))) {
    throw new Error(`No encontre firebase local en ${FIREBASE_BIN}`);
  }
};

const createEnv = async ({
  useEmulators = true,
  firestoreHost = DEFAULT_FIRESTORE_HOST,
  authHost = DEFAULT_AUTH_HOST,
} = {}) => {
  const env = { ...process.env };
  const javaBin = path.join(DEFAULT_JAVA_HOME, 'bin');

  if (
    process.platform === 'win32' &&
    env.JAVA_HOME !== DEFAULT_JAVA_HOME &&
    (await fileExists(path.join(javaBin, 'java.exe')))
  ) {
    env.JAVA_HOME = DEFAULT_JAVA_HOME;
    env.Path = env.Path ? `${javaBin};${env.Path}` : javaBin;
  }

  if (useEmulators) {
    env.VITE_USE_EMULATORS = '1';
    env.FIRESTORE_EMULATOR_HOST = firestoreHost;
    env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
    env.VITE_AUTH_EMULATOR_PORT = authHost.split(':').at(-1) || '9099';
    env.GCLOUD_PROJECT = env.GCLOUD_PROJECT || DEFAULT_PROJECT_ID;
    env.GOOGLE_CLOUD_PROJECT = env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT_ID;
  }

  return env;
};

const runCommand = ({
  command,
  args = [],
  env,
  label,
  stdio = 'pipe',
  shell = false,
}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio,
      shell,
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
    }

    child.on('error', (error) => {
      reject(
        new Error(
          `${label || command} fallo al iniciar: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${label || command} salio con codigo ${code}\n${stdout}${stderr}`.trim(),
        ),
      );
    });
  });

const getPortPidsWindows = async (ports) => {
  const result = await runCommand({
    command: 'netstat',
    args: ['-ano', '-p', 'tcp'],
    env: process.env,
    label: 'netstat',
  });

  const targets = new Set(ports.map(String));
  const pidByPort = new Map();

  for (const rawLine of result.stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('TCP')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 5) continue;
    const local = parts[1];
    const state = parts[3];
    const pid = parts[4];
    if (state !== 'LISTENING') continue;
    const localParts = local.split(':');
    const port = localParts[localParts.length - 1];
    if (!targets.has(port)) continue;

    const numericPid = Number(pid);
    if (!Number.isInteger(numericPid) || numericPid <= 0) continue;

    const portNumber = Number(port);
    const current = pidByPort.get(portNumber) || new Set();
    current.add(numericPid);
    pidByPort.set(portNumber, current);
  }

  return pidByPort;
};

const getPortPids = async (ports) => {
  if (process.platform === 'win32') {
    return getPortPidsWindows(ports);
  }

  const pidByPort = new Map();
  for (const port of ports) {
    try {
      const result = await runCommand({
        command: 'lsof',
        args: ['-ti', `tcp:${port}`],
        env: process.env,
        label: 'lsof',
      });
      const pids = result.stdout
        .split(/\r?\n/)
        .map((entry) => Number(entry.trim()))
        .filter((entry) => Number.isInteger(entry) && entry > 0);

      if (pids.length > 0) {
        pidByPort.set(port, new Set(pids));
      }
    } catch {
      // Ignore missing lsof / no listeners.
    }
  }
  return pidByPort;
};

const getManagedPidSet = async () => {
  const pidByPort = await getPortPids(MANAGED_PORTS);
  const pids = new Set();

  for (const values of pidByPort.values()) {
    for (const pid of values) {
      pids.add(pid);
    }
  }

  return { pidByPort, pids };
};

const taskKillPid = async (pid) => {
  if (process.platform === 'win32') {
    await runCommand({
      command: 'taskkill',
      args: ['/PID', String(pid), '/T', '/F'],
      env: process.env,
      label: `taskkill ${pid}`,
    });
    return;
  }

  await runCommand({
    command: 'kill',
    args: ['-9', String(pid)],
    env: process.env,
    label: `kill ${pid}`,
  });
};

const stopManagedProcesses = async () => {
  const { pidByPort, pids } = await getManagedPidSet();

  if (pids.size === 0) {
    console.log('[local-dev] sin procesos en puertos gestionados');
    return;
  }

  const portLines = Array.from(pidByPort.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([port, values]) => `${port}: ${Array.from(values).join(',')}`);

  console.log('[local-dev] cerrando procesos en puertos gestionados');
  for (const line of portLines) {
    console.log(`- ${line}`);
  }

  for (const pid of pids) {
    try {
      await taskKillPid(pid);
    } catch (error) {
      console.warn(
        `[local-dev] no pude cerrar PID ${pid}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
};

const isPortOpen = (port, host = '127.0.0.1') =>
  new Promise((resolve) => {
    const socket = new net.Socket();

    const finalize = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(800);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, host);
  });

const waitForPorts = async (ports, timeoutMs = DEFAULT_START_TIMEOUT_MS) => {
  const startedAt = Date.now();
  const pending = new Set(ports);

  while (pending.size > 0) {
    for (const port of Array.from(pending)) {
      if (await isPortOpen(port)) {
        pending.delete(port);
      }
    }

    if (pending.size === 0) {
      return;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(
        `Timeout esperando puertos: ${Array.from(pending).join(', ')}`,
      );
    }

    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }
};

const findLatestSeedFile = async () => {
  const baseDir = path.resolve(process.cwd(), 'tmp', 'emulator-seeds');
  if (!(await fileExists(baseDir))) {
    return null;
  }

  const businesses = await fs.readdir(baseDir, { withFileTypes: true });
  const candidates = [];

  for (const entry of businesses) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(baseDir, entry.name, 'business-slice.json');
    if (!(await fileExists(candidate))) continue;
    const stats = await fs.stat(candidate);
    candidates.push({ path: candidate, mtimeMs: stats.mtimeMs });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return candidates[0].path;
};

const runSeedImport = async ({ seedFile, projectId, env }) => {
  console.log(`[local-dev] importando seed ${seedFile}`);

  const args = [
    path.resolve(process.cwd(), 'tools', 'import-business-slice-to-emulator.mjs'),
    `--in=${seedFile}`,
    `--project-id=${projectId}`,
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`seed:import salio con codigo ${code}`));
    });
  });
};

const spawnManagedChild = ({
  command,
  args = [],
  env,
  shell = false,
  label,
}) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    shell,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[local-dev] ${label} salio con codigo ${code}`);
    }
  });

  return child;
};

const attachShutdown = (children) => {
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('\n[local-dev] cerrando procesos hijos...');

    for (const child of children) {
      if (!child || child.exitCode !== null) continue;
      try {
        if (process.platform === 'win32') {
          await taskKillPid(child.pid);
        } else {
          child.kill('SIGINT');
        }
      } catch (error) {
        console.warn(
          `[local-dev] no pude cerrar hijo ${child.pid}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });
};

const printStatus = async () => {
  const { pidByPort } = await getManagedPidSet();

  if (pidByPort.size === 0) {
    console.log('[local-dev] sin listeners en puertos gestionados');
    return;
  }

  console.log('[local-dev] puertos ocupados');
  for (const [port, pids] of Array.from(pidByPort.entries()).sort(
    (left, right) => left[0] - right[0],
  )) {
    console.log(`- ${port}: ${Array.from(pids).join(', ')}`);
  }
};

const startStack = async (flags) => {
  await ensureLocalBinaries();

  const projectId = toCleanString(flags['project-id']) || DEFAULT_PROJECT_ID;
  const withVite = !parseBooleanFlag(flags['no-vite'], false);
  let withSeed = !parseBooleanFlag(flags['skip-seed'], false);

  if (withSeed && process.stdin.isTTY && !process.env.CI && flags.seed === undefined && flags['skip-seed'] === undefined) {
    try {
      const pkgContent = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8');
      const pkgJson = JSON.parse(pkgContent);
      if (pkgJson.name === 'ventamax') {
        const prompt = new Confirm({
          name: 'question',
          message: '¿Deseas poblar el emulador con datos de prueba (VentaMas)?',
          initial: true,
        });
        withSeed = await prompt.run();
      }
    } catch (e) {
      console.log('\n[local-dev] Cancelado por el usuario.');
      process.exit(0);
    }
  }

  const stopBeforeStart = !parseBooleanFlag(flags['keep-existing'], false);
  const timeoutMs = parseIntegerFlag(flags.timeout, DEFAULT_START_TIMEOUT_MS);

  if (stopBeforeStart) {
    await stopManagedProcesses();
  }

  const env = await createEnv({
    useEmulators: true,
    firestoreHost: DEFAULT_FIRESTORE_HOST,
    authHost: DEFAULT_AUTH_HOST,
  });

  console.log(`[local-dev] JAVA_HOME=${env.JAVA_HOME || '(sin cambio)'}`);
  console.log(`[local-dev] project=${projectId}`);

  const emulatorArgs = [
    'emulators:start',
    '--only',
    'auth,firestore,functions',
    '--project',
    projectId,
  ];

  const children = [];
  const emulatorChild = spawnManagedChild({
    command: FIREBASE_BIN,
    args: emulatorArgs,
    env,
    label: 'firebase emulators',
  });
  children.push(emulatorChild);

  attachShutdown(children);

  console.log('[local-dev] esperando Auth 9099, Firestore 8081 y Functions 5001...');
  await waitForPorts([8081, 9099, 5001], timeoutMs);
  console.log('[local-dev] emuladores listos');

  if (withSeed) {
    const explicitSeed = toCleanString(flags.seed);
    const seedFile = explicitSeed
      ? path.resolve(process.cwd(), explicitSeed)
      : await findLatestSeedFile();

    if (seedFile) {
      await runSeedImport({ seedFile, projectId, env });
    } else {
      console.log('[local-dev] no encontre seed. omitiendo import');
    }
  }

  if (withVite) {
    const viteChild = spawnManagedChild({
      command: NPM_BIN,
      args: ['run', 'dev'],
      env,
      label: 'vite dev',
    });
    children.push(viteChild);
    console.log('[local-dev] vite iniciado con VITE_USE_EMULATORS=1');
  } else {
    console.log('[local-dev] vite omitido por --no-vite');
  }

  console.log('[local-dev] stack arriba. Ctrl+C para cerrar todo.');
};

const printUsage = () => {
  console.log(`
Uso:
  node .\\tools\\local-dev-cli.mjs <start|stop|status> [opciones]

Comandos:
  start   Cierra restos, arranca auth+firestore+functions, importa seed y levanta vite.
  stop    Cierra procesos en puertos gestionados (${MANAGED_PORTS.join(', ')}).
  status  Muestra listeners en puertos gestionados.

Opciones start:
  --project-id=<id>      Default: ${DEFAULT_PROJECT_ID}
  --seed=<ruta-json>     Seed explicito. Si falta, toma el business-slice mas reciente.
  --skip-seed            No importa seed.
  --no-vite              No arranca Vite.
  --keep-existing        No mata listeners antes de arrancar.
  --timeout=<ms>         Default: ${DEFAULT_START_TIMEOUT_MS}
  --help                 Muestra ayuda.
`.trim());
};

const main = async () => {
  const { positional, flags } = parseCliArgs(process.argv);
  const command = positional[0] || 'start';

  if (flags.help) {
    printUsage();
    return;
  }

  switch (command) {
    case 'start':
      await startStack(flags);
      return;
    case 'stop':
      await stopManagedProcesses();
      return;
    case 'status':
      await printStatus();
      return;
    default:
      throw new Error(`Comando no soportado: ${command}`);
  }
};

main().catch((error) => {
  console.error('[local-dev] failed');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
