import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsconfigPath = path.resolve(__dirname, 'tsconfig.strict.json');

const result = spawnSync(
  'npx',
  ['tsc', '--noEmit', '--project', tsconfigPath],
  {
    encoding: 'utf8',
    shell: true,
  },
);

const rawOutput = `${result.stdout || ''}${result.stderr || ''}`.trim();

const errorLineRegex =
  /^(?<file>.+?)\((?<line>\d+),(?<col>\d+)\):\s+error\s+(?<code>TS\d+):\s+(?<message>.*)$/;

const fileErrors = new Map();

rawOutput.split(/\r?\n/).forEach((line) => {
  const match = line.match(errorLineRegex);
  if (!match || !match.groups) return;
  const { file, code, message } = match.groups;
  const normalizedFile = file.replace(/\\/g, '/');

  if (!fileErrors.has(normalizedFile)) {
    fileErrors.set(normalizedFile, []);
  }
  fileErrors.get(normalizedFile).push({ code, message });
});

if (fileErrors.size === 0) {
  console.log('Sin errores de TypeScript.');
  process.exitCode = result.status ?? 0;
  process.exit(process.exitCode);
}

const sortedFiles = Array.from(fileErrors.entries()).sort(
  (a, b) => b[1].length - a[1].length,
);

const totalErrors = sortedFiles.reduce(
  (sum, [, errors]) => sum + errors.length,
  0,
);

let reportOutput = '';
reportOutput += `Reporte completo de errores de TypeScript\n`;
reportOutput += `Total: ${totalErrors} errores en ${sortedFiles.length} archivos\n`;
reportOutput += `Generado: ${new Date().toLocaleString('es-ES')}\n`;
reportOutput += '='.repeat(80) + '\n\n';

sortedFiles.forEach(([file, errors], index) => {
  const line = `#${index + 1} ${file} (${errors.length} errores)\n`;
  reportOutput += line;

  const errorsByMsg = new Map();
  errors.forEach(({ code, message }) => {
    const key = `${code}: ${message}`;
    errorsByMsg.set(key, (errorsByMsg.get(key) || 0) + 1);
  });

  const sortedErrorMsgs = Array.from(errorsByMsg.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  sortedErrorMsgs.forEach(([msg, count]) => {
    const errorLine = `  - ${count}x ${msg}\n`;
    reportOutput += errorLine;
  });
  reportOutput += '\n';
});

reportOutput += '='.repeat(80) + '\n';
reportOutput += `Resumen Final: ${totalErrors} errores distribuidos en ${sortedFiles.length} archivos.\n`;

// Mostrar solo top 10 en consola
console.log(`\nTop 10 archivos con más errores (Total: ${totalErrors} errores en ${sortedFiles.length} archivos):\n`);
sortedFiles.slice(0, 10).forEach(([file, errors], index) => {
  console.log(`#${index + 1} ${file} (${errors.length} errores)`);
});
console.log(`\n(Reporte completo de ${sortedFiles.length} archivos guardado en reports/)`);

// Guardar reporte en reports/
const reportsDir = path.resolve(__dirname, '..', 'reports');
mkdirSync(reportsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const reportPath = path.join(reportsDir, `typescript-audit-${timestamp}.txt`);
const latestReportPath = path.join(reportsDir, 'typescript-audit-latest.txt');

writeFileSync(reportPath, reportOutput, 'utf8');
writeFileSync(latestReportPath, reportOutput, 'utf8');

console.log(`\nReporte guardado en:\n  - ${reportPath}\n  - ${latestReportPath}`);

process.exitCode = result.status ?? 1;
process.exit(process.exitCode);
