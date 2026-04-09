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

function checkForBOM(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(3);
    const bytesRead = fs.readSync(fd, buffer, 0, 3, 0);
    fs.closeSync(fd);

    if (
      bytesRead >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
    ) {
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
    return false;
  }
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Ignorar carpetas
        if (
          ![
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
          ].includes(file)
        ) {
          walkDir(filePath, fileList);
        }
      } else {
        if (extensions.includes(path.extname(file))) {
          fileList.push(filePath);
        }
      }
    } catch (e) {
      console.error(`Error accessing ${filePath}: ${e.message}`);
    }
  });
  return fileList;
}

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');

const rootDir = process.cwd();
console.log(`🔍 Buscando archivos con BOM (Byte Order Mark) en: ${rootDir}`);
if (fixMode) {
  console.log(
    '🔧 Modo corrección activado: Se eliminará el BOM de los archivos afectados.',
  );
}

const files = walkDir(rootDir);
let foundIssues = false;
let fixedCount = 0;

files.forEach((file) => {
  if (file.includes('scan-utf8-bom.js')) return;

  if (checkForBOM(file)) {
    foundIssues = true;
    if (fixMode) {
      try {
        const content = fs.readFileSync(file);
        // Remove the first 3 bytes (BOM)
        const newContent = content.subarray(3);
        fs.writeFileSync(file, newContent);
        console.log(`✅ BOM eliminado de: ${path.relative(rootDir, file)}`);
        fixedCount++;
      } catch (err) {
        console.error(
          `❌ Error al corregir ${path.relative(rootDir, file)}: ${err.message}`,
        );
      }
    } else {
      console.log(`⚠️  BOM detectado en: ${path.relative(rootDir, file)}`);
    }
  }
});

if (!foundIssues) {
  console.log('\n✅ No se encontraron archivos con BOM.');
} else {
  if (fixMode) {
    console.log(`\n✨ Se corrigieron ${fixedCount} archivos.`);
  } else {
    console.log(
      '\n⚠️  Se encontraron archivos con BOM. Esto puede causar problemas en algunos entornos.',
    );
    console.log(
      "👉 Ejecuta este script con '--fix' para eliminarlos automáticamente: node tools/scan-utf8-bom.js --fix",
    );
  }
}
