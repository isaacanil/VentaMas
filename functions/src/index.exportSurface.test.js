import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(srcRoot, 'app');
const indexPath = path.join(srcRoot, 'index.js');

const deployableDefinitionPattern =
  /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:https\.)?on[A-Z][A-Za-z0-9_$]*\s*\(/g;
const exportBlockPattern =
  /export\s*\{([\s\S]*?)\}\s*(?:from\s*['"][^'"]+['"])?\s*;/g;
const exportAliasPattern = /\bas\s+([A-Za-z_$][\w$]*)$/;
const exportedIdentifierPattern = /^([A-Za-z_$][\w$]*)/;

const intentionallyUnexportedDeployables = new Map([
  [
    'clientListSessions',
    'app/versions/v2/auth/controllers/clientAuth.controller.js',
  ],
  [
    'clientValidateSession',
    'app/versions/v2/auth/controllers/clientAuth.controller.js',
  ],
  [
    'handleInvoiceRequest',
    'app/modules/invoice/controllers/invoice.controller.js',
  ],
  [
    'invoiceLetterPdf',
    'app/modules/invoice/templates/template2/InvoiceLetterPdf.js',
  ],
  ['syncNcfLedger', 'app/versions/v2/invoice/triggers/ncfLedger.worker.js'],
  [
    'updateStockOnInvoiceCreate',
    'app/versions/v1/modules/inventory/triggers/updateStockOnInvoiceCreate.js',
  ],
]);

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    if (
      !/\.[jt]s$/.test(entry.name) ||
      /\.(test|spec)\.[jt]s$/.test(entry.name)
    ) {
      return [];
    }

    return [entryPath];
  });
}

function toRelativeSourcePath(filePath) {
  return path.relative(srcRoot, filePath).replaceAll(path.sep, '/');
}

function getDeployableDefinitions() {
  return listSourceFiles(appRoot)
    .flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      const matches = Array.from(
        source.matchAll(deployableDefinitionPattern),
        (match) => ({
          name: match[1],
          filePath: toRelativeSourcePath(filePath),
        }),
      );

      return matches;
    })
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        left.filePath.localeCompare(right.filePath),
    );
}

function getPublicIndexExports() {
  const indexSource = fs.readFileSync(indexPath, 'utf8');
  const exportedNames = new Set();

  for (const exportBlockMatch of indexSource.matchAll(exportBlockPattern)) {
    for (const rawExport of exportBlockMatch[1].split(',')) {
      const exportEntry = rawExport.trim();

      if (!exportEntry) {
        continue;
      }

      const exportedName =
        exportEntry.match(exportAliasPattern)?.[1] ??
        exportEntry.match(exportedIdentifierPattern)?.[1];

      if (exportedName) {
        exportedNames.add(exportedName);
      }
    }
  }

  return exportedNames;
}

describe('Cloud Functions export surface', () => {
  it('keeps every deployable definition either exported by index.js or explicitly allowlisted', () => {
    const publicIndexExports = getPublicIndexExports();
    const missingExports = getDeployableDefinitions()
      .filter(({ name }) => !publicIndexExports.has(name))
      .map(({ name, filePath }) => [name, filePath]);

    expect(missingExports).toEqual(
      Array.from(intentionallyUnexportedDeployables.entries()).sort(
        ([leftName, leftPath], [rightName, rightPath]) =>
          leftName.localeCompare(rightName) ||
          leftPath.localeCompare(rightPath),
      ),
    );
  });
});
