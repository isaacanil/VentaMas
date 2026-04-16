import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

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

const cliPath = path.resolve(process.cwd(), 'tools', 'local-dev-cli.mjs');
const child = spawn(process.execPath, [cliPath, 'start', ...args], {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
