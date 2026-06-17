import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const srcRoot = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(srcRoot, 'index.js');

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

function getImportSpecifiers(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS,
  );
  const specifiers = [];

  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      ) {
        specifiers.push(node.arguments[0].text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function getRelativeImports(filePath) {
  return getImportSpecifiers(filePath)
    .filter((specifier) => specifier.startsWith('.'))
    .map((specifier) => resolveSourceFile(filePath, specifier))
    .filter(Boolean);
}

function getUnresolvedRelativeImports(sourceFiles) {
  return sourceFiles
    .flatMap((filePath) =>
      getImportSpecifiers(filePath)
        .filter((specifier) => specifier.startsWith('.'))
        .filter((specifier) => resolveSourceFile(filePath, specifier) === null)
        .map((specifier) => `${toRelativeSourcePath(filePath)} -> ${specifier}`),
    )
    .sort();
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

function getAllowlistedRootPaths() {
  return intentionallyUnreachableRuntimeRoots.map((relativePath) =>
    path.join(srcRoot, relativePath),
  );
}

describe('Cloud Functions import graph', () => {
  it('keeps intentionally unreachable runtime allowlist paths pointing at source files', () => {
    const staleAllowlistedRoots = getAllowlistedRootPaths()
      .filter((filePath) => !fs.existsSync(filePath))
      .map(toRelativeSourcePath)
      .sort();

    expect(staleAllowlistedRoots).toEqual([]);
  });

  it('keeps runtime source files reachable from index.js or explicitly allowlisted', () => {
    const sourceFiles = listSourceFiles(srcRoot);
    const allowlistedRootPaths = getAllowlistedRootPaths();
    const unresolvedRelativeImports = getUnresolvedRelativeImports(sourceFiles);
    const reachableFiles = collectReachableFiles([
      indexPath,
      ...allowlistedRootPaths,
    ]);

    const unreachableFiles = sourceFiles
      .filter((filePath) => !reachableFiles.has(filePath))
      .map(toRelativeSourcePath)
      .sort();

    expect(unresolvedRelativeImports).toEqual([]);
    expect(unreachableFiles).toEqual([]);
  });
});
