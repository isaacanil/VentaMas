#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import enquirerPkg from 'enquirer';
import {
  getCollectionDocs,
  getOrInitEmulatorDb,
} from './business-slice/utils.mjs';

const { Confirm, Input, Select } = enquirerPkg;

const MANAGED_PORTS = [4000, 4400, 4500, 5001, 8081, 9099, 9150, 5173, 5174, 5175, 5176];
const DEFAULT_PROJECT_ID = 'ventamaxpos';
const DEFAULT_FIRESTORE_HOST = '127.0.0.1:8081';
const DEFAULT_AUTH_HOST = '127.0.0.1:9099';
const DEFAULT_START_TIMEOUT_MS = 240_000;
const DEFAULT_POLL_INTERVAL_MS = 750;
const DEFAULT_JAVA_HOME =
  'C:\\Tools\\microsoft-jdk-21.0.10-windows-x64\\jdk-21.0.10+7';

const FIREBASE_CLI_JS = path.resolve(
  process.cwd(),
  'node_modules',
  'firebase-tools',
  'lib',
  'bin',
  'firebase.js',
);

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const DEFAULT_OPENING_CASH = 2000;
const CASH_COUNT_DENOMINATIONS = [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
const SESSION_FILE_PATH = path.resolve(process.cwd(), 'tmp', 'vm-session.json');
const CONTROL_HOST = '127.0.0.1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldUseShell = (command, shell = false) =>
  shell || (process.platform === 'win32' && /\.cmd$/i.test(command));

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

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const readJsonIfExists = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
};

const removeFileIfExists = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const isPidAlive = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const normalizeFlags = (flags) => {
  const output = {};
  for (const [key, value] of Object.entries(flags || {})) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output;
};

const readSessionInfo = async () => {
  const session = await readJsonIfExists(SESSION_FILE_PATH);
  if (!isRecord(session)) return null;

  const pid = Number(session.pid);
  const port = Number(session.controlPort);
  if (!Number.isInteger(pid) || !Number.isInteger(port)) {
    return null;
  }

  return {
    ...session,
    pid,
    controlPort: port,
  };
};

const getActiveSessionInfo = async () => {
  const session = await readSessionInfo();
  if (!session) return null;

  if (!isPidAlive(session.pid)) {
    await removeFileIfExists(SESSION_FILE_PATH);
    return null;
  }

  return session;
};

const ensureLocalBinaries = async () => {
  if (!(await fileExists(FIREBASE_CLI_JS))) {
    throw new Error(`No encontre firebase local en ${FIREBASE_CLI_JS}`);
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
      shell: shouldUseShell(command, shell),
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

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    let raw = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => resolve(raw));
    request.on('error', reject);
  });

const sendJsonResponse = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(`${JSON.stringify(payload)}\n`);
};

const invokeControlSession = async ({
  session,
  command,
  flags = {},
}) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify({
      command,
      flags: normalizeFlags(flags),
    });

    const request = http.request(
      {
        host: CONTROL_HOST,
        port: session.controlPort,
        path: '/execute',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      },
      (response) => {
        let raw = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          try {
            const parsed = raw.trim() ? JSON.parse(raw) : {};
            if (response.statusCode && response.statusCode >= 400) {
              reject(
                new Error(
                  parsed?.error || `Control devolvio ${response.statusCode}`,
                ),
              );
              return;
            }
            resolve(parsed);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
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
    try {
      await runCommand({
        command: 'taskkill',
        args: ['/PID', String(pid), '/T', '/F'],
        env: process.env,
        label: `taskkill ${pid}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('no se encontró el proceso') ||
        message.includes('no se encontr') ||
        message.includes('not found')
      ) {
        return;
      }
      throw error;
    }
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

const readLatestSeedManifest = async () => {
  const latestSeedPath = await findLatestSeedFile();
  if (!latestSeedPath) {
    return null;
  }

  const raw = await fs.readFile(latestSeedPath, 'utf-8');
  const manifest = JSON.parse(raw);
  return isRecord(manifest)
    ? {
        path: latestSeedPath,
        manifest,
      }
    : null;
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

const toNumberAmount = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return Number(numeric.toFixed(2));
};

const buildBanknotesFromAmount = (amount) => {
  let remaining = Math.round(amount);
  const quantities = new Map();

  for (const denomination of [...CASH_COUNT_DENOMINATIONS].sort((left, right) => right - left)) {
    const quantity = Math.floor(remaining / denomination);
    quantities.set(denomination, quantity > 0 ? quantity : null);
    remaining -= quantity * denomination;
  }

  const banknotes = CASH_COUNT_DENOMINATIONS.map((value) => ({
    ref: String(value),
    value,
    quantity: quantities.get(value) ?? null,
  }));

  const banknotesAmount = banknotes.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0),
    0,
  );

  return {
    banknotes,
    banknotesAmount,
    banknotesTotal: amount,
  };
};

const extractEmployeeIdFromCashCount = (cashCount) => {
  const employee = cashCount?.opening?.employee;
  if (!employee) return null;

  if (typeof employee.path === 'string' && employee.path.startsWith('users/')) {
    return employee.path.split('/')[1] || null;
  }

  if (typeof employee.id === 'string' && employee.id.trim()) {
    return employee.id.trim();
  }

  if (typeof employee.uid === 'string' && employee.uid.trim()) {
    return employee.uid.trim();
  }

  return null;
};

const resolveBusinessAndUser = async ({ flags, db }) => {
  const explicitBusinessId = toCleanString(flags['business-id']);
  const explicitUserId = toCleanString(flags['user-id']);

  if (explicitBusinessId && explicitUserId) {
    return {
      businessId: explicitBusinessId,
      userId: explicitUserId,
      source: 'flags',
    };
  }

  const latestSeed = await readLatestSeedManifest();
  const seedBusinessId =
    explicitBusinessId ||
    toCleanString(latestSeed?.manifest?.businessId);
  const seedUserId =
    explicitUserId ||
    toCleanString(latestSeed?.manifest?.localAuth?.uid);

  if (seedBusinessId && seedUserId) {
    return {
      businessId: seedBusinessId,
      userId: seedUserId,
      source: latestSeed?.path || 'seed-manifest',
    };
  }

  const businesses = await getCollectionDocs(db, 'businesses');
  const resolvedBusinessId =
    explicitBusinessId ||
    (businesses.length === 1 ? businesses[0].id : null);

  if (!resolvedBusinessId) {
    throw new Error(
      'No pude resolver businessId. Usa --business-id o importa un seed reciente.',
    );
  }

  if (explicitUserId) {
    return {
      businessId: resolvedBusinessId,
      userId: explicitUserId,
      source: 'flags',
    };
  }

  const members = await getCollectionDocs(
    db,
    `businesses/${resolvedBusinessId}/members`,
  );

  if (members.length === 1) {
    return {
      businessId: resolvedBusinessId,
      userId: members[0].id,
      source: 'business-members',
    };
  }

  const users = await getCollectionDocs(db, 'users');
  if (users.length === 1) {
    return {
      businessId: resolvedBusinessId,
      userId: users[0].id,
      source: 'users',
    };
  }

  throw new Error(
    'No pude resolver userId. Usa --user-id o deja un solo user/member en emulador.',
  );
};

const seedOpenCashCount = async (flags) => {
  if (await delegateToActiveSessionIfNeeded('seed-cash-count', flags)) {
    return;
  }

  const projectId = toCleanString(flags['project-id']) || DEFAULT_PROJECT_ID;
  const openingCash = toNumberAmount(flags['opening-cash'], DEFAULT_OPENING_CASH);
  const comment =
    toCleanString(flags.comment) || 'Cuadre de prueba generado por vm';

  await ensureFirestoreEmulatorRunning();

  const env = await createEnv({
    useEmulators: true,
    firestoreHost: DEFAULT_FIRESTORE_HOST,
    authHost: DEFAULT_AUTH_HOST,
  });

  process.env.GCLOUD_PROJECT = env.GCLOUD_PROJECT;
  process.env.GOOGLE_CLOUD_PROJECT = env.GOOGLE_CLOUD_PROJECT;
  process.env.FIRESTORE_EMULATOR_HOST = env.FIRESTORE_EMULATOR_HOST;

  const db = getOrInitEmulatorDb({ projectId });
  const { businessId, userId, source } = await resolveBusinessAndUser({ flags, db });
  const cashCounts = await getCollectionDocs(db, `businesses/${businessId}/cashCounts`);

  const existingOpenCashCount = cashCounts.find((entry) => {
    const cashCount = entry.data?.cashCount;
    return (
      cashCount?.state === 'open' &&
      extractEmployeeIdFromCashCount(cashCount) === userId
    );
  });

  if (existingOpenCashCount) {
    console.log(
      `[local-dev] ya existe cuadre abierto para ${userId}: ${existingOpenCashCount.id}`,
    );
    return;
  }

  const nextIncrement =
    cashCounts.reduce((max, entry) => {
      const rawValue = Number(entry.data?.cashCount?.incrementNumber);
      return Number.isFinite(rawValue) && rawValue > max ? rawValue : max;
    }, 0) + 1;

  const docId = `cash-count-${Date.now()}`;
  const now = new Date();
  const openingSummary = buildBanknotesFromAmount(openingCash);

  const cashCount = {
    id: docId,
    incrementNumber: nextIncrement,
    cashAccountId: null,
    state: 'open',
    opening: {
      initialized: true,
      employee: db.doc(`users/${userId}`),
      approvalEmployee: null,
      date: now,
      banknotes: openingSummary.banknotes,
      banknotesTotal: openingSummary.banknotesTotal,
      banknotesAmount: openingSummary.banknotesAmount,
      comments: comment,
      totals: null,
    },
    closing: {
      initialized: false,
      employee: null,
      approvalEmployee: null,
      date: null,
      banknotes: openingSummary.banknotes.map((item) => ({
        ...item,
        quantity: null,
      })),
      banknotesTotal: 0,
      banknotesAmount: 0,
      comments: null,
      totals: null,
    },
    sales: [],
    receivablePayments: [],
    totalCard: 0,
    totalTransfer: 0,
    totalCharged: 0,
    totalReceivables: 0,
    totalDiscrepancy: 0,
    totalRegister: openingCash,
    totalSystem: openingCash,
    totalExpenses: 0,
    totalSales: 0,
    total: openingCash,
    totalFacturado: 0,
    discrepancy: 0,
    stateHistory: [
      {
        state: 'open',
        timestamp: now,
        updatedBy: userId,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  await db.doc(`businesses/${businessId}/cashCounts/${docId}`).set({ cashCount });

  console.log(`[local-dev] cuadre abierto creado: ${docId}`);
  console.log(`[local-dev] business=${businessId} user=${userId} source=${source}`);
  console.log(`[local-dev] monto inicial=${openingCash}`);
};

const startControlServer = async ({ projectId }) => {
  let actionQueue = Promise.resolve();

  const handlers = {
    seed: async (flags) => {
      await seedRunningEmulator({
        ...flags,
        'project-id': flags['project-id'] || projectId,
      });
      return { ok: true, message: 'seed importado' };
    },
    'seed-cash-count': async (flags) => {
      await seedOpenCashCount({
        ...flags,
        'project-id': flags['project-id'] || projectId,
      });
      return { ok: true, message: 'cuadre creado o ya existente' };
    },
    status: async () => ({
      ok: true,
      message: 'sesion activa',
    }),
  };

  const server = http.createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/status') {
        sendJsonResponse(response, 200, {
          ok: true,
          pid: process.pid,
          projectId,
          startedAt: new Date().toISOString(),
        });
        return;
      }

      if (request.method !== 'POST' || request.url !== '/execute') {
        sendJsonResponse(response, 404, { ok: false, error: 'Ruta no soportada' });
        return;
      }

      const rawBody = await readRequestBody(request);
      const payload = rawBody.trim() ? JSON.parse(rawBody) : {};
      const command = toCleanString(payload.command);
      const flags = isRecord(payload.flags) ? payload.flags : {};

      if (!command || !handlers[command]) {
        sendJsonResponse(response, 400, {
          ok: false,
          error: `Comando control no soportado: ${command || '(vacio)'}`,
        });
        return;
      }

      actionQueue = actionQueue.catch(() => undefined).then(async () => {
        console.log(`[vm-control] comando=${command}`);
        return handlers[command](flags);
      });

      const result = await actionQueue;
      sendJsonResponse(response, 200, result);
    } catch (error) {
      sendJsonResponse(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, CONTROL_HOST, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('No pude resolver puerto del control server.');
  }

  return {
    server,
    controlPort: address.port,
  };
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
    shell: shouldUseShell(command, shell),
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[local-dev] ${label} salio con codigo ${code}`);
    }
  });

  return child;
};

const attachShutdown = (children, onShutdown = async () => {}) => {
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

    await onShutdown();
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
  const session = await getActiveSessionInfo();
  if (session) {
    console.log('[local-dev] sesion activa');
    console.log(`- pid: ${session.pid}`);
    console.log(`- project: ${session.projectId}`);
    console.log(`- control: http://${CONTROL_HOST}:${session.controlPort}`);
    console.log(`- startedAt: ${session.startedAt}`);
  }

  const { pidByPort } = await getManagedPidSet();

  if (pidByPort.size === 0) {
    if (!session) {
      console.log('[local-dev] sin listeners en puertos gestionados');
    }
    return;
  }

  console.log('[local-dev] puertos ocupados');
  for (const [port, pids] of Array.from(pidByPort.entries()).sort(
    (left, right) => left[0] - right[0],
  )) {
    console.log(`- ${port}: ${Array.from(pids).join(', ')}`);
  }
};

const resolveSeedFilePath = async (flags) => {
  const explicitSeed = toCleanString(flags.seed);
  if (explicitSeed) {
    const resolved = path.resolve(process.cwd(), explicitSeed);
    if (!(await fileExists(resolved))) {
      throw new Error(`No existe seed: ${resolved}`);
    }
    return resolved;
  }

  const latestSeed = await findLatestSeedFile();
  if (!latestSeed) {
    throw new Error(
      'No encontre seed en tmp/emulator-seeds. Exporta uno primero o usa --seed=<ruta-json>.',
    );
  }

  return latestSeed;
};

const ensureFirestoreEmulatorRunning = async () => {
  const firestoreUp = await isPortOpen(8081);
  if (!firestoreUp) {
    throw new Error(
      'Firestore emulator no responde en 127.0.0.1:8081. Arranca primero `vm start`.',
    );
  }
};

const delegateToActiveSessionIfNeeded = async (command, flags) => {
  const session = await getActiveSessionInfo();
  if (!session || session.pid === process.pid) {
    return false;
  }

  const result = await invokeControlSession({
    session,
    command,
    flags,
  });

  console.log(
    `[local-dev] comando delegado a sesion ${session.pid}: ${result?.message || command}`,
  );
  return true;
};

const seedRunningEmulator = async (flags) => {
  if (await delegateToActiveSessionIfNeeded('seed', flags)) {
    return;
  }

  const projectId = toCleanString(flags['project-id']) || DEFAULT_PROJECT_ID;
  const seedFile = await resolveSeedFilePath(flags);

  await ensureFirestoreEmulatorRunning();

  const env = await createEnv({
    useEmulators: true,
    firestoreHost: DEFAULT_FIRESTORE_HOST,
    authHost: DEFAULT_AUTH_HOST,
  });

  console.log(`[local-dev] project=${projectId}`);
  await runSeedImport({ seedFile, projectId, env });
  console.log('[local-dev] seed importado en emulador activo');
};

const startStack = async (flags) => {
  await ensureLocalBinaries();
  await removeFileIfExists(SESSION_FILE_PATH);

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
  const startedAt = new Date().toISOString();
  let controlServer = null;
  const emulatorChild = spawnManagedChild({
    command: process.execPath,
    args: [FIREBASE_CLI_JS, ...emulatorArgs],
    env,
    label: 'firebase emulators',
  });
  children.push(emulatorChild);

  attachShutdown(children, async () => {
    if (controlServer) {
      await new Promise((resolve, reject) => {
        controlServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
    await removeFileIfExists(SESSION_FILE_PATH);
  });

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

  const control = await startControlServer({ projectId });
  controlServer = control.server;
  await writeJsonFile(SESSION_FILE_PATH, {
    pid: process.pid,
    projectId,
    controlPort: control.controlPort,
    startedAt,
    cwd: process.cwd(),
  });

  console.log(`[local-dev] control=http://${CONTROL_HOST}:${control.controlPort}`);
  console.log('[local-dev] stack arriba. Ctrl+C para cerrar todo.');
};

const runInteractiveMenu = async () => {
  if (!process.stdin.isTTY || process.env.CI) {
    throw new Error('`vm menu` requiere terminal interactiva.');
  }

  let session = await getActiveSessionInfo();
  if (!session) {
    throw new Error('No hay sesion activa. Arranca primero `vm start`.');
  }

  console.log(
    `[local-dev] menu conectado a pid=${session.pid} project=${session.projectId}`,
  );

  while (true) {
    session = await getActiveSessionInfo();
    if (!session) {
      throw new Error('Sesion cerrada mientras menu estaba abierto.');
    }

    let action;
    try {
      action = await new Select({
        name: 'action',
        message: 'VM menu',
        choices: [
          {
            name: 'seed-latest',
            message: 'Importar ultimo seed',
          },
          {
            name: 'seed-cash-count-default',
            message: `Crear cuadre abierto (${DEFAULT_OPENING_CASH})`,
          },
          {
            name: 'seed-cash-count-custom',
            message: 'Crear cuadre abierto (monto custom)',
          },
          {
            name: 'status',
            message: 'Ver status',
          },
          {
            name: 'exit',
            message: 'Salir',
          },
        ],
      }).run();
    } catch (error) {
      if (error === '') {
        console.log('[local-dev] menu cancelado');
        return;
      }
      throw error;
    }

    if (action === 'exit') {
      console.log('[local-dev] menu cerrado');
      return;
    }

    if (action === 'status') {
      await printStatus();
      continue;
    }

    if (action === 'seed-latest') {
      const result = await invokeControlSession({
        session,
        command: 'seed',
        flags: {},
      });
      console.log(`[local-dev] ${result?.message || 'seed lanzado'}`);
      continue;
    }

    if (action === 'seed-cash-count-default') {
      const result = await invokeControlSession({
        session,
        command: 'seed-cash-count',
        flags: {},
      });
      console.log(`[local-dev] ${result?.message || 'cuadre lanzado'}`);
      continue;
    }

    if (action === 'seed-cash-count-custom') {
      const rawAmount = await new Input({
        name: 'openingCash',
        message: 'Monto inicial',
        initial: String(DEFAULT_OPENING_CASH),
      }).run();

      const amount = toNumberAmount(rawAmount, Number.NaN);
      if (!Number.isFinite(amount)) {
        console.log('[local-dev] monto invalido');
        continue;
      }

      const result = await invokeControlSession({
        session,
        command: 'seed-cash-count',
        flags: {
          'opening-cash': amount,
        },
      });
      console.log(`[local-dev] ${result?.message || 'cuadre lanzado'}`);
    }
  }
};

const printUsage = () => {
  console.log(`
Uso:
  node .\\tools\\local-dev-cli.mjs <start|stop|status|seed|seed-cash-count|menu> [opciones]

Comandos:
  start   Cierra restos, arranca auth+firestore+functions, importa seed y levanta vite.
  stop    Cierra procesos en puertos gestionados (${MANAGED_PORTS.join(', ')}).
  status  Muestra listeners en puertos gestionados.
  seed    Importa seed al Firestore emulator ya iniciado.
  seed-cash-count  Crea un cuadre abierto para ventas en emulador.
  menu    Abre menu interactivo contra sesion activa.

Opciones start:
  --project-id=<id>      Default: ${DEFAULT_PROJECT_ID}
  --seed=<ruta-json>     Seed explicito. Si falta, toma el business-slice mas reciente.
  --skip-seed            No importa seed.
  --no-vite              No arranca Vite.
  --keep-existing        No mata listeners antes de arrancar.
  --timeout=<ms>         Default: ${DEFAULT_START_TIMEOUT_MS}
  --help                 Muestra ayuda.

Opciones seed:
  --project-id=<id>      Default: ${DEFAULT_PROJECT_ID}
  --seed=<ruta-json>     Seed explicito. Si falta, toma el business-slice mas reciente.

Opciones seed-cash-count:
  --project-id=<id>      Default: ${DEFAULT_PROJECT_ID}
  --business-id=<id>     Opcional. Si falta, resuelve desde seed o emulador.
  --user-id=<id>         Opcional. Si falta, usa localAuth.uid, member unico o user unico.
  --opening-cash=<monto> Default: ${DEFAULT_OPENING_CASH}
  --comment=<texto>      Comentario inicial.
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
    case 'seed':
      await seedRunningEmulator(flags);
      return;
    case 'seed-cash-count':
      await seedOpenCashCount(flags);
      return;
    case 'menu':
      await runInteractiveMenu();
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
