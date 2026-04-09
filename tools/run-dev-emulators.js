import { spawn } from 'child_process';

const EMULATOR_DATA = process.env.EMULATOR_DATA_DIR || 'emulator-data';
const TRACE_ENDPOINT =
  process.env.VITE_FLOW_TRACE_ENDPOINT || 'http://localhost:8787/trace';

const args = process.argv.slice(2);
const hasAutoFlag =
  args.includes('--auto') ||
  args.includes('--auto=1') ||
  args.includes('--auto=true');
const autoTrace = process.env.VITE_FLOW_TRACE_AUTO === '1' || hasAutoFlag;

const env = {
  ...process.env,
  VITE_USE_EMULATORS: '1',
  VITE_FLOW_TRACE: '1',
  VITE_FLOW_TRACE_ENDPOINT: TRACE_ENDPOINT,
  ...(autoTrace ? { VITE_FLOW_TRACE_AUTO: '1' } : {}),
};

const spawnProcess = (command, name) => {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env,
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
};

const processes = [
  spawnProcess(
    `firebase emulators:start --only firestore,functions --import ${EMULATOR_DATA} --export-on-exit`,
    'firebase-emulators',
  ),
  spawnProcess('npm run dev', 'vite-dev'),
];

const shutdown = () => {
  processes.forEach((proc) => {
    if (!proc.killed) {
      proc.kill('SIGINT');
    }
  });
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
