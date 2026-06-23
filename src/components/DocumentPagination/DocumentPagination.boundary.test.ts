import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const componentRoot = path.dirname(fileURLToPath(import.meta.url));
const sourceFileExtensions = new Set(['.ts', '.tsx']);
const skippedSourceFilePattern = /\.(test|spec|stories)\.[cm]?[jt]sx?$/;
const forbiddenDependencies = [
  '@react-pdf/renderer',
  '@vivliostyle/core',
  'jspdf',
  'jspdf-autotable',
  'pagedjs',
  'pdfmake',
  'print-js',
  'react-to-print',
  'vivliostyle',
];
const forbiddenSourceMarkers = [
  '@/modules/dev',
  '@/modules/invoice',
  '@/modules/sales',
  '@/services/invoice',
  'PrintPaginationLab',
  'printInvoiceWithVivliostyle',
];

const listImplementationFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listImplementationFiles(entryPath);
    }

    if (
      !sourceFileExtensions.has(path.extname(entry.name)) ||
      skippedSourceFilePattern.test(entry.name)
    ) {
      return [];
    }

    return [entryPath];
  });

describe('DocumentPagination boundaries', () => {
  it('stays reusable and isolated from PDF libraries, dev lab, and invoice flows', () => {
    const violations = listImplementationFiles(componentRoot)
      .flatMap((filePath) => {
        const fileContent = readFileSync(filePath, 'utf8');
        const lowerContent = fileContent.toLowerCase();

        return [
          ...forbiddenDependencies
            .filter((dependency) =>
              lowerContent.includes(dependency.toLowerCase()),
            )
            .map(
              (dependency) =>
                `${path.relative(componentRoot, filePath)} -> ${dependency}`,
            ),
          ...forbiddenSourceMarkers
            .filter((marker) => fileContent.includes(marker))
            .map(
              (marker) =>
                `${path.relative(componentRoot, filePath)} -> ${marker}`,
            ),
        ];
      })
      .sort();

    expect(violations).toEqual([]);
  });

  it('keeps browser-only print helpers out of the main render barrel', () => {
    const mainBarrel = readFileSync(path.join(componentRoot, 'index.ts'), 'utf8');
    const browserBarrel = readFileSync(
      path.join(componentRoot, 'browser.ts'),
      'utf8',
    );
    const mainBarrelExportSources = Array.from(
      mainBarrel.matchAll(/from\s+['"]([^'"]+)['"]/g),
      ([, exportSource]) => exportSource,
    );

    expect(mainBarrelExportSources).toEqual([
      './PaginatedDocument',
      './PaginatedDocument',
    ]);
    expect(mainBarrel).not.toContain('printFrozenPaginatedDocument');
    expect(mainBarrel).not.toContain('createFrozenPaginatedDocumentHtml');
    expect(mainBarrel).not.toMatch(/from\s+['"]\.\/browser['"]/);
    expect(mainBarrel).not.toMatch(
      /from\s+['"]\.\/utils\/printFrozenPaginatedDocument['"]/,
    );
    expect(browserBarrel).toContain('createFrozenPaginatedDocumentHtml');
    expect(browserBarrel).toContain('printFrozenPaginatedDocument');
  });
});
