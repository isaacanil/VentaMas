import pkg from 'enquirer';
const { Select, Confirm } = pkg;
import { consola } from 'consola';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const SCRIPTS = {
  '🚀 Full Quality Check (Format + Lint + Typecheck + Styles + Build)': [
    'format',
    'lint:web',
    'typecheck',
    'lint:styles',
    'build',
  ],
  '🧹 Format Code (Prettier)': ['format'],
  '🔍 Logic Lint (ESLint)': ['lint:web'],
  '💪 Type Check (TSC)': ['typecheck'],
  '🎨 Styles Check (Stylelint)': ['lint:styles'],
  '📦 Build Application (Vite)': ['build'],
  '--- Diagnostics & Reports ---': null,
  '📊 Lint Stats Report': ['lint:report'],
  '📑 TypeScript Audit': ['audit:ts'],
  '🚫 Scan Suppressions (eslint_disable/ts-ignore)': ['audit:suppressions'],
  '♻️  Find Unused Exports': ['check-unused-exports'],
  '⚖️  Analyze File Sizes (Diagnose)': ['diagnose'],
  '🔤 Scan Encoding Issues': ['scan-encoding'],
  '❌ Exit': null,
};

async function runCommand(script) {
  return new Promise((resolve) => {
    consola.info(`Executing: npm run ${script}...`);
    const child = spawn('npm', ['run', script], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        consola.success(`Successfully finished: npm run ${script}`);
        resolve(true);
      } else {
        consola.error(`Failed: npm run ${script} (Exit code: ${code})`);
        resolve(false);
      }
    });
  });
}

async function main() {
  console.clear();
  consola.box({
    title: 'VentaMas Quality Hub',
    message: 'Select a task to maintain your frontend code quality.',
    style: {
      padding: 1,
      borderColor: 'cyan',
      borderStyle: 'double',
    },
  });

  const prompt = new Select({
    name: 'task',
    message: 'What would you like to do?',
    choices: Object.keys(SCRIPTS),
  });

  try {
    const choice = await prompt.run();

    if (choice === '❌ Exit') {
      consola.info('Goodbye! 👋');
      process.exit(0);
    }

    const scriptList = SCRIPTS[choice];

    if (!scriptList) {
      if (choice !== '❌ Exit') {
        consola.warn(
          'This is a separator or an empty option. Please select a valid task.',
        );
        await new Promise((r) => setTimeout(r, 1500));
        return main();
      }
      return;
    }

    let allSuccess = true;
    for (const script of scriptList) {
      const success = await runCommand(script);
      if (!success) {
        allSuccess = false;
        break;
      }
    }

    if (allSuccess) {
      consola.success('All tasks completed successfully! ✨');
    } else {
      consola.warn('Some tasks failed. Please check the output above.');
    }

    const retryPrompt = new Confirm({
      name: 'retry',
      message: 'Return to main menu?',
    });

    const retry = await retryPrompt.run();
    if (retry) {
      main();
    } else {
      consola.info('Goodbye! 👋');
    }
  } catch (err) {
    if (err !== '') {
      // Enquirer throws empty string on Ctrl+C
      consola.error('An error occurred:', err);
    }
    process.exit(0);
  }
}

main();
