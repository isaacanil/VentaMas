import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const labRoot = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(labRoot, '../../../../..');
const sourceFileExtensions = new Set(['.ts', '.tsx']);
const forbiddenDependencies = [
  '@react-pdf/renderer',
  '@vivliostyle/core',
  '@/modules/invoice',
  '@/modules/sales',
  '@/services/invoice',
  'InvoiceTemplate2V3_1',
  'jspdf',
  'jspdf-autotable',
  'pagedjs',
  'pdfmake',
  'print-js',
  'processInvoice',
  'printInvoiceWithVivliostyle',
  'react-redux',
  'react-to-print',
  'selectBusinessData',
  'vivliostyle',
];

const listImplementationFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listImplementationFiles(entryPath);
    }

    if (
      !sourceFileExtensions.has(path.extname(entry.name)) ||
      entry.name.endsWith('.test.ts') ||
      entry.name.endsWith('.test.tsx')
    ) {
      return [];
    }

    return [entryPath];
  });

describe('PrintPaginationLab boundaries', () => {
  it('stays isolated from Vivliostyle and PDF generation dependencies', () => {
    expect(existsSync(labRoot)).toBe(true);

    const violations = listImplementationFiles(labRoot)
      .flatMap((filePath) => {
        const fileContent = readFileSync(filePath, 'utf8').toLowerCase();

        return forbiddenDependencies
          .filter((dependency) =>
            fileContent.includes(dependency.toLowerCase()),
          )
          .map(
            (dependency) =>
              `${path.relative(labRoot, filePath)} -> ${dependency}`,
          );
      })
      .sort();

    expect(violations).toEqual([]);
  });

  it('keeps lab route imports behind dev-route build gates', () => {
    const labRouteFile = readFileSync(
      path.join(srcRoot, 'router/routes/paths/Lab.tsx'),
      'utf8',
    );
    const routePreloadersFile = readFileSync(
      path.join(srcRoot, 'router/routes/routePreloaders.ts'),
      'utf8',
    );

    expect(labRouteFile).not.toContain('@/modules/dev/pages');
    expect(labRouteFile).toContain('import.meta.env.DEV');
    expect(routePreloadersFile).not.toContain('@/modules/dev/pages');
    expect(routePreloadersFile).not.toMatch(
      /import\s*\{[\s\S]*loadPrintPaginationLabRoute[\s\S]*\}\s*from\s*'@\/modules\/dev\/public'/,
    );
    expect(routePreloadersFile).toContain('import.meta.env.DEV');
  });
});
