/**
 * Component audit: detect exact duplicates and likely duplicates in src/.
 *
 * Usage:
 *   node tools/component-audit.mjs --outDir=C:\Dev\test\VentaMas\components-audit
 *
 * Output:
 *   <outDir>\<YYYYMMDD-HHMMSS>\component-duplicates.json
 *   <outDir>\<YYYYMMDD-HHMMSS>\component-duplicates.md
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );
  return {
    rootDir: args.rootDir || process.cwd(),
    outDir: args.outDir || '',
    maxPairs: Number.isFinite(Number(args.maxPairs)) ? Number(args.maxPairs) : 120,
  };
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const isoStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    String(d.getFullYear()) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

const walk = (dir, acc) => {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    if (it.name === 'node_modules' || it.name === 'dist' || it.name === '.git') continue;
    const full = path.resolve(dir, it.name);
    if (it.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
};

const isCodeFile = (p) => /\.(tsx|ts|jsx|js)$/.test(p);

const normalizeForHash = (content) => {
  // Drop most whitespace and obvious comment blocks to catch near-identical files.
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenize = (content) => {
  // Very simple tokenization: words + punctuation groups.
  const normalized = normalizeForHash(content);
  return normalized.split(/[^a-zA-Z0-9_]+/).filter(Boolean);
};

const jaccard = (aTokens, bTokens) => {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
};

const basenameKey = (p) => path.basename(p).toLowerCase();

const toMd = (report) => {
  const lines = [];
  lines.push('# Component Audit');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Exact duplicates (normalized content hash)');
  lines.push('');
  if (report.exactDuplicates.length === 0) {
    lines.push('No exact duplicates found.');
  } else {
    for (const g of report.exactDuplicates) {
      lines.push(`- hash=${g.hash} (${g.files.length} files)`);
      for (const f of g.files) lines.push(`  - ${f}`);
    }
  }
  lines.push('');
  lines.push('## Likely duplicates (Jaccard token similarity)');
  lines.push('');
  lines.push('| score | fileA | fileB |');
  lines.push('| - | - | - |');
  for (const p of report.likelyDuplicates) {
    lines.push(`| ${p.score.toFixed(3)} | ${p.fileA} | ${p.fileB} |`);
  }
  return lines.join('\n');
};

const main = async () => {
  const { rootDir, outDir, maxPairs } = parseArgs();
  const repoRoot = rootDir;

  const files = [];
  walk(repoRoot, files);

  // Focus on src/ only to avoid tooling noise.
  const srcFiles = files
    .filter((p) => p.includes(`${path.sep}src${path.sep}`))
    .filter(isCodeFile)
    .filter((p) => !p.includes(`${path.sep}__tests__${path.sep}`) && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx'));

  const items = [];
  for (const fp of srcFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    const normalized = normalizeForHash(content);
    const hash = sha1(normalized);
    items.push({
      file: path.relative(repoRoot, fp).replace(/\\/g, '/'),
      base: basenameKey(fp),
      hash,
      tokens: tokenize(content),
      size: content.length,
    });
  }

  // Exact duplicates by normalized hash (ignore tiny files)
  const byHash = new Map();
  for (const it of items) {
    if (it.size < 400) continue;
    if (!byHash.has(it.hash)) byHash.set(it.hash, []);
    byHash.get(it.hash).push(it.file);
  }
  const exactDuplicates = [...byHash.entries()]
    .filter(([, arr]) => arr.length > 1)
    .map(([hash, arr]) => ({ hash, files: arr.sort() }))
    .sort((a, b) => b.files.length - a.files.length);

  // Likely duplicates: compare within same basename bucket to keep it cheap.
  const byBase = new Map();
  for (const it of items) {
    if (!byBase.has(it.base)) byBase.set(it.base, []);
    byBase.get(it.base).push(it);
  }

  const likely = [];
  for (const [, bucket] of byBase.entries()) {
    if (bucket.length < 2) continue;
    // Pairwise within bucket.
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const a = bucket[i];
        const b = bucket[j];
        const score = jaccard(a.tokens, b.tokens);
        // High similarity threshold; skip if they are already exact duplicates.
        if (score >= 0.72 && a.hash !== b.hash) {
          likely.push({ score, fileA: a.file, fileB: b.file, base: a.base });
        }
      }
    }
  }

  likely.sort((a, b) => b.score - a.score);
  const likelyDuplicates = likely.slice(0, Math.max(0, maxPairs));

  const resolvedOutDir = outDir
    ? path.resolve(outDir, isoStamp())
    : path.resolve(repoRoot, '.tmp', 'component-audit', isoStamp());
  ensureDir(resolvedOutDir);

  const report = {
    generatedAt: new Date().toISOString(),
    rootDir: repoRoot,
    outDir: resolvedOutDir,
    scanned: { srcFiles: srcFiles.length },
    exactDuplicates,
    likelyDuplicates,
  };

  fs.writeFileSync(
    path.resolve(resolvedOutDir, 'component-duplicates.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  fs.writeFileSync(path.resolve(resolvedOutDir, 'component-duplicates.md'), toMd(report), 'utf8');

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        outDir: resolvedOutDir,
        scanned: report.scanned,
        exactDuplicates: report.exactDuplicates.length,
        likelyDuplicates: report.likelyDuplicates.length,
      },
      null,
      2,
    ),
  );
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

