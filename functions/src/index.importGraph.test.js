import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(srcRoot, 'index.js');

const importSpecifierPattern =
  /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const intentionallyUnreachableRuntimeRoots = [
  'app/modules/invoice/controllers/invoice.controller.js',
  'app/modules/invoice/templates/template2/InvoiceLetterPdf.js',
  'app/modules/taxReceipt/services/taxReceiptService.ts',
  'app/versions/v1/modules/inventory/triggers/updateStockOnInvoiceCreate.js',
  'app/versions/v2/auth/utils/ownership.util.js',
  'app/versions/v2/billing/adapters/azul.provider.js',
  'app/versions/v2/billing/config/planCatalogBootstrapDefaults.js',
  'app/versions/v2/invoice/triggers/ncfLedger.worker.js',
];

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

function resolveSourceFile(importerPath, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const resolvedPath = path.resolve(path.dirname(importerPath), specifier);
  const candidates = [
    resolvedPath,
    `${resolvedPath}.js`,
    `${resolvedPath}.ts`,
    path.join(resolvedPath, 'index.js'),
    path.join(resolvedPath, 'index.ts'),
  ];

  if (resolvedPath.endsWith('.js')) {
    candidates.push(resolvedPath.replace(/\.js$/, '.ts'));
  }

  if (resolvedPath.endsWith('.ts')) {
    candidates.push(resolvedPath.replace(/\.ts$/, '.js'));
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function getRelativeImports(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  return Array.from(source.matchAll(importSpecifierPattern), (match) =>
    [match[1], match[2], match[3]].find(Boolean),
  )
    .filter(Boolean)
    .map((specifier) => resolveSourceFile(filePath, specifier))
    .filter(Boolean);
}

function collectReachableFiles(entryPaths) {
  const reachable = new Set();
  const pending = [...entryPaths];

  while (pending.length > 0) {
    const filePath = pending.pop();

    if (!filePath || reachable.has(filePath) || !filePath.startsWith(srcRoot)) {
      continue;
    }

    reachable.add(filePath);
    pending.push(...getRelativeImports(filePath));
  }

  return reachable;
}

describe('Cloud Functions import graph', () => {
  it('keeps runtime source files reachable from index.js or explicitly allowlisted', () => {
    const sourceFiles = listSourceFiles(srcRoot);
    const allowlistedRootPaths = intentionallyUnreachableRuntimeRoots.map(
      (relativePath) => path.join(srcRoot, relativePath),
    );
    const reachableFiles = collectReachableFiles([
      indexPath,
      ...allowlistedRootPaths,
    ]);

    const unreachableFiles = sourceFiles
      .filter((filePath) => !reachableFiles.has(filePath))
      .map(toRelativeSourcePath)
      .sort();

    expect(unreachableFiles).toEqual([]);
  });
});
