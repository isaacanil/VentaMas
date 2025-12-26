import fs from 'fs';
import path from 'path';

// En ESM, usamos import.meta.dirname para obtener la ruta del script actual
const currentDir = import.meta.dirname;
// Como el script está en /tools, subimos un nivel para encontrar /src
const rootDir = path.resolve(currentDir, '../src');
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
const alias = '@';

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles.filter(file =>
        extensions.some(ext => file.endsWith(ext))
    );
}

const resolvedImports = new Set();

function resolveImport(sourceFile, importPath) {
    let targetPath = '';

    if (importPath.startsWith(alias + '/')) {
        // Handle alias
        const relativePath = importPath.substring(alias.length + 1);
        targetPath = path.join(rootDir, relativePath);
    } else if (importPath.startsWith('.')) {
        // Handle relative imports
        targetPath = path.resolve(path.dirname(sourceFile), importPath);
    } else {
        // Node modules or other imports - ignore for now
        return true;
    }

    // Check if file exists with extensions
    if (fs.existsSync(targetPath) && !fs.statSync(targetPath).isDirectory()) {
        resolvedImports.add(path.normalize(targetPath));
        return true;
    }

    for (const ext of extensions) {
        if (fs.existsSync(targetPath + ext)) {
            resolvedImports.add(path.normalize(targetPath + ext));
            return true;
        }
    }

    // Check index files
    const indexExtensions = extensions.map(ext => '/index' + ext);
    for (const ext of indexExtensions) {
        if (fs.existsSync(targetPath + ext)) {
            resolvedImports.add(path.normalize(targetPath + ext));
            return true;
        }
    }

    return false;
}

const repoRoot = path.resolve(currentDir, '..');
const reportsDir = path.join(repoRoot, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

const files = getAllFiles(rootDir);
const brokenImports = [];

if (files.length === 0) {
    console.error(`❌ No se encontraron archivos en ${rootDir}. Revisa la ruta.`);
    process.exit(1);
}

console.log(`Scanning ${files.length} files in ${rootDir}...`);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /from\s+['"]([^'"]+)['"]|import\s*\(['"]([^'"]+)['"]\)|require\s*\(['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2] || match[3];

        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineContent = content.substring(lineStart, match.index);
        if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('/*')) {
            continue;
        }
        const precedingContent = content.substring(0, match.index);
        if (precedingContent.lastIndexOf('/*') > precedingContent.lastIndexOf('*/')) {
            continue;
        }

        if (importPath && (importPath.startsWith('.') || importPath.startsWith('@/'))) {
            const resolved = resolveImport(file, importPath);
            if (!resolved) {
                const lines = content.substring(0, match.index).split('\n');
                const lineNum = lines.length;
                const relFile = path.relative(repoRoot, file);
                brokenImports.push({
                    file: relFile,
                    line: lineNum,
                    importPath: importPath
                });
                console.error(`Missing import in ${relFile}:${lineNum}: ${importPath}`);
            }
        }
    }
});

fs.writeFileSync('broken_imports.json', JSON.stringify(brokenImports, null, 2));

if (brokenImports.length === 0) {
    console.log('✅ No broken relative or alias imports found.');
} else {
    console.log(`⚠️ Found ${brokenImports.length} broken imports. Results saved to broken_imports.json`);
}
