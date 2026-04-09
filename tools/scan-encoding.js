import fs from 'fs';
import path from 'path';

const extensions = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.html',
  '.css',
  '.scss',
];
const ignoredDirs = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.vite',
  'coverage',
  '.firebase',
  '.github',
  '.storybook',
  '.tools',
  '.vscode',
  'public',
]);

const suspiciousSequences = [
  { seq: 'ÃƒÆ’Ã…Â¡', char: 'Ú' },
  { seq: 'ÃƒÆ’Ã‚Â¡', char: 'á' },
  { seq: 'ÃƒÆ’Ã‚Â©', char: 'é' },
  { seq: 'ÃƒÆ’Ã‚Â­', char: 'í' },
  { seq: 'ÃƒÆ’Ã‚Â³', char: 'ó' },
  { seq: 'ÃƒÆ’Ã‚Âº', char: 'ú' },
  { seq: 'ÃƒÆ’Ã‚Â±', char: 'ñ' },
  { seq: 'ÃƒÆ’Ã¢â‚¬Â¡', char: 'Ç' },
  { seq: 'ÃƒÆ’Ã¢â‚¬Â ', char: 'À' },
  { seq: 'ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦', char: '…' },
  { seq: 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â', char: '—' },
  { seq: 'ÃƒÂ¡', char: 'á' },
  { seq: 'ÃƒÂ©', char: 'é' },
  { seq: 'ÃƒÂ­', char: 'í' },
  { seq: 'ÃƒÂ³', char: 'ó' },
  { seq: 'ÃƒÂº', char: 'ú' },
  { seq: 'ÃƒÂ±', char: 'ñ' },
  { seq: 'Ãƒ¡', char: 'á' },
  { seq: 'Ãƒ©', char: 'é' },
  { seq: 'Ãƒ³', char: 'ó' },
  { seq: 'Ãƒú', char: 'ú' },
  { seq: 'Ãƒ±', char: 'ñ' },
  { seq: 'Ã¡', char: 'á' },
  { seq: 'Ã©', char: 'é' },
  { seq: 'Ã­', char: 'í' },
  { seq: 'Ã³', char: 'ó' },
  { seq: 'Ãº', char: 'ú' },
  { seq: 'Ã±', char: 'ñ' },
  { seq: 'Ãš', char: 'Ú' },
  { seq: 'Ã³n', char: 'ón' },
  { seq: 'Ã­a', char: 'ía' },
  { seq: 'Ãƒâ€˜', char: 'Ñ' },
  { seq: 'Ãƒâ€°', char: 'É' },
  { seq: 'Ãƒâ€œ', char: 'Ó' },
  { seq: 'ÃƒÅ¡', char: 'Ú' },
  { seq: 'Ã‚Â¿', char: '¿' },
  { seq: 'Ã‚Â¡', char: '¡' },
  { seq: 'Ãƒ', char: 'Posible fragmento UTF-8 roto (C3)' },
];

const questionMappings = [
  { pattern: 'aci?n', fix: 'ación' },
  { pattern: 'ici?n', fix: 'ición' },
  { pattern: 'r?m', fix: 'rám' },
  { pattern: 'm?l', fix: 'múl' },
  { pattern: 'c?l', fix: 'cál' },
  { pattern: 'n?m', fix: 'núm' },
  { pattern: 'i?n', fix: 'ión' },
  { pattern: 'm?s', fix: 'más' },
  { pattern: 'M?s', fix: 'Más' },
  { pattern: 'a?a', fix: 'aña' },
  { pattern: 'A?a', fix: 'Aña' },
  { pattern: 'a?ad', fix: 'añad' },
  { pattern: 'r?a', fix: 'ría' },
  { pattern: 'u?s', fix: 'ués' },
  { pattern: 'est? ', fix: 'está ' },
  { pattern: 'par?m', fix: 'parám' },
  { pattern: 'm?lt', fix: 'múlt' },
  { pattern: 'encontr?', fix: 'encontró' },
  { pattern: 'cr?di', fix: 'crédi' },
  { pattern: 'pr?xim', fix: 'próxim' },
  { pattern: 'sesi?n', fix: 'sesión' },
  { pattern: 'configuraci?n', fix: 'configuración' },
  { pattern: 'int?ntalo', fix: 'inténtalo' },
  { pattern: 'g?n', fix: 'gún' },
  { pattern: 'S?', fix: 'Sí' },
  { pattern: 'C?l', fix: 'Cál' },
  { pattern: 'N?m', fix: 'Núm' },
  { pattern: 'r?x', fix: 'róx' },
  { pattern: 'm?n', fix: 'mín' },
];

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');

function scanFile(file, content) {
  let newContent = content;
  const issues = [];
  const isPackageLock = file.includes('package-lock.json');

  // Mojibake
  for (const { seq, char } of suspiciousSequences) {
    if (!content.includes(seq)) continue;
    if (
      seq === 'Ãƒ' &&
      suspiciousSequences.some(
        (s) =>
          s.seq !== 'Ãƒ' && s.seq.startsWith('Ãƒ') && content.includes(s.seq),
      )
    ) {
      continue;
    }
    const matches = content.split(seq).length - 1;
    const isFixedCandidate = !char.includes('Posible');
    if (fixMode && isFixedCandidate) {
      const re = new RegExp(seq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      newContent = newContent.replace(re, char);
      issues.push({ sequence: seq, char, count: matches, fixed: true });
    } else {
      issues.push({ sequence: seq, char, count: matches, fixed: false });
    }
  }

  // Question Marks
  if (!isPackageLock) {
    for (const { pattern, fix } of questionMappings) {
      if (newContent.includes(pattern)) {
        const matches = newContent.split(pattern).length - 1;
        if (fixMode) {
          const re = new RegExp(
            pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'g',
          );
          newContent = newContent.replace(re, fix);
          issues.push({
            sequence: pattern,
            char: fix,
            count: matches,
            fixed: true,
          });
        } else {
          issues.push({
            sequence: pattern,
            char: fix,
            count: matches,
            fixed: false,
          });
        }
      }
    }

    // Remaining suspicious ?
    const regex = /[a-zA-ZáéíóúÁÉÓÚñÑ]\?[a-z]/g;
    const matches = newContent.match(regex);
    if (matches) {
      matches.forEach((m) => {
        if (m === 'y?i' || m === 'e?g') return;

        if (
          !issues.some((i) => i.fixed && i.char.includes(m.replace('?', '')))
        ) {
          issues.push({
            sequence: m,
            char: 'Carácter roto (?)',
            count: 1,
            fixed: false,
          });
        }
      });
    }
  } else {
    const regex = /[a-zA-ZáéíóúÁÉÓÚñÑ]\?[a-z]/g;
    const matches = content.match(regex);
    if (matches) {
      matches.forEach((m) =>
        issues.push({
          sequence: m,
          char: 'Carácter roto (?)',
          count: 1,
          fixed: false,
        }),
      );
    }
  }

  return {
    issues,
    content: newContent,
    fixed: fixMode && newContent !== content,
  };
}

const rootDir = process.cwd();
console.log(`Buscando problemas en: ${rootDir}`);
const files = [];

function walk(dir) {
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        if (!ignoredDirs.has(f)) walk(p);
      } else if (extensions.includes(path.extname(f))) {
        files.push(p);
      }
    }
  } catch {
    // console.error(`Error walking ${dir}`);
  }
}
walk(rootDir);

let stats = { files: 0, issues: 0, fixed: 0 };

for (const file of files) {
  if (file.includes('scan-encoding')) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const result = scanFile(file, content);

    if (result.issues.length > 0) {
      stats.files++;
      console.log(`\n${path.relative(rootDir, file)}:`);
      result.issues.forEach((i) => {
        console.log(
          `  [${i.fixed ? 'FIXED' : 'WARN'}] '${i.sequence}' -> '${i.char}' (${i.count} veces)`,
        );
      });
      if (result.fixed) {
        fs.writeFileSync(file, result.content, 'utf8');
        stats.fixed++;
      }
    }
  } catch {
    // console.error(`Error processing ${file}`);
  }
}

console.log(`\nResumen: ${stats.fixed}/${stats.files} archivos corregidos.`);
