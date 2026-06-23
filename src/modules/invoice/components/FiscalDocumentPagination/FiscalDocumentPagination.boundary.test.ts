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
  '@/modules/dev',
  '@/modules/sales',
  '@/services/invoice',
  'InvoiceTemplate',
  'HiddenInvoicePrintContainer',
  'jspdf',
  'jspdf-autotable',
  'pagedjs',
  'pdfmake',
  'print-js',
  'react-redux',
  'react-to-print',
  'selectBusinessData',
  'table-footer-group',
  'table-header-group',
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
      skippedSourceFilePattern.test(entry.name)
    ) {
      return [];
    }

    return [entryPath];
  });

describe('FiscalDocumentPagination boundaries', () => {
  it('stays isolated from lab code, legacy print flows and PDF engines', () => {
    const violations = listImplementationFiles(componentRoot)
      .flatMap((filePath) => {
        const fileContent = readFileSync(filePath, 'utf8').toLowerCase();

        return forbiddenDependencies
          .filter((dependency) =>
            fileContent.includes(dependency.toLowerCase()),
          )
          .map(
            (dependency) =>
              `${path.relative(componentRoot, filePath)} -> ${dependency}`,
          );
      })
      .sort();

    expect(violations).toEqual([]);
  });
});
