import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REPO_ROOT = path.join(__dirname, '..');
const SRC_PATH = path.join(REPO_ROOT, 'src');
const REPORT_DIR = path.join(REPO_ROOT, 'reports');
const CSV_PATH = path.join(REPORT_DIR, 'unused-exports.csv');
const JSON_PATH = path.join(REPORT_DIR, 'unused-exports.json');
const EXCLUDE_DIRS = [
    'node_modules', '.git', 'dist', 'build', 'coverage', 'out',
    '.next', '.nuxt', 'storybook-static', 'cypress', 'playwright',
    '.turbo', '.yarn', '.pnpm-store'
];

// Files known to be entry points or auto-loaded (e.g. Vites config, main entry points)
const ENTRY_POINTS = [
    'main.jsx', 'main.tsx', 'index.jsx', 'index.tsx', 'App.jsx', 'App.tsx',
    'firebase-messaging-sw.js', 'vite-env.d.ts'
];
const ENTRY_POINT_MATCHERS = [
    /\.spec\.(js|ts|jsx|tsx)$/, // Tests
    /\.test\.(js|ts|jsx|tsx)$/, // Tests
    /\.stories\.(js|ts|jsx|tsx)$/, // Storybook
    /setupTests\.(js|ts)$/ // Test setup
];

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.d.ts'];

// Files to never flag as orphans (e.g. types, configs)
const PROTECTED_EXTENSIONS = ['.ts', '.d.ts'];


// Regex Patterns
const REGEX = {
    blockComment: /\/\*[\s\S]*?\*\//g,
    lineComment: /\/\/.*$/gm,
    export: {
        var: /^\s*export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
        fn: /^\s*export\s+function\s+([A-Za-z_$][\w$]*)/gm,
        class: /^\s*export\s+class\s+([A-Za-z_$][\w$]*)/gm,
        type: /^\s*export\s+type\s+([A-Za-z_$][\w$]*)/gm,
        interface: /^\s*export\s+interface\s+([A-Za-z_$][\w$]*)/gm,
        enum: /^\s*export\s+enum\s+([A-Za-z_$][\w$]*)/gm,
        namedList: /^\s*export\s+\{\s*([^}]+)\s*\}(?:\s+from\s+['"]([^'"]+)['"])?/gm,
        typeNamedList: /^\s*export\s+type\s+\{\s*([^}]+)\s*\}(?:\s+from\s+['"]([^'"]+)['"])?/gm,
        nsReexport: /^\s*export\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/gm,
        defaultNamed: /^\s*export\s+default\s+(?:function|class)\s+([A-Za-z_$][\w$]*)/gm,
        defaultAnon: /^\s*export\s+default\s+(?!function|class)(.+)$/gm,
    },
    import: {
        named: /^\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/gm,
        default: /^\s*import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]+\}\s*)?from\s+['"]([^'"]+)['"]/gm,
        namespace: /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/gm,
        typeNamed: /^\s*import\s+type\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/gm,
        typeDefault: /^\s*import\s+type\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/gm,
        typeNamespace: /^\s*import\s+type\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/gm,
        require: /^\s*const\s+\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/gm,
        dynamic: /import\(\s*['"]([^'"]+)['"]\s*\)/gm // dynamic import()
    }
};

async function getAllFiles(dir) {
    let fileList = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    const tasks = entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(entry.name)) {
                const subFiles = await getAllFiles(fullPath);
                fileList = fileList.concat(subFiles);
            }
        } else if (entry.isFile()) {
            if (EXTENSIONS.includes(path.extname(entry.name))) {
                fileList.push(fullPath);
            }
        }
    });

    await Promise.all(tasks);
    return fileList;
}

function removeComments(content) {
    return content.replace(REGEX.blockComment, '').replace(REGEX.lineComment, '');
}

async function parseFile(filePath) {
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const cleanContent = removeComments(content);
        const relPath = path.relative(path.join(__dirname, '../'), filePath).replace(/\\/g, '/');
        const fileName = path.basename(filePath);

        // Check entry point match
        let isEntryPoint = ENTRY_POINTS.includes(fileName);
        if (!isEntryPoint) {
            for (const matcher of ENTRY_POINT_MATCHERS) {
                if (matcher.test(fileName)) {
                    isEntryPoint = true;
                    break;
                }
            }
        }

        const exports = [];
        const imports = [];

        // Helper to add export
        const addExport = (name, kind, isDefault = false) => {
            exports.push({ name, kind, isDefault });
        };

        // Helper to add import
        const addImport = (name, specifier, kind, isDefault = false, isNs = false) => {
            imports.push({ name, specifier, kind, isDefault, isNs, sourceFile: relPath });
        };

        // --- Parse Exports ---
        for (const [key, regex] of Object.entries(REGEX.export)) {
            let match;
            regex.lastIndex = 0; // Reset regex state
            while ((match = regex.exec(cleanContent)) !== null) {
                if (key === 'namedList' || key === 'typeNamedList') {
                    const list = match[1].split(',').map(s => s.trim()).filter(Boolean);
                    const specifier = match[2];
                    list.forEach(item => {
                        const parts = item.split(/\s+as\s+/);
                        const name = parts.length > 1 ? parts[1] : parts[0];
                        addExport(name.replace(/^type\s+/, ''), 'named');
                    });
                    if (specifier) {
                        addImport('*', specifier, 'reexport', false, true);
                    }
                } else if (key === 'defaultNamed') {
                    addExport(match[1], 'default', true);
                } else if (key === 'defaultAnon') {
                    addExport('<default>', 'default', true);
                } else if (key === 'nsReexport') {
                    addExport(match[1], 'named');
                } else {
                    addExport(match[1], match[0].includes('export type') ? 'type' : 'named');
                }
            }
        }

        // --- Parse Imports ---
        let match;
        // Named
        REGEX.import.named.lastIndex = 0;
        while ((match = REGEX.import.named.exec(cleanContent)) !== null) {
            const list = match[1].split(',').map(s => s.trim()).filter(Boolean);
            match[2]; // specifier
            list.forEach(item => {
                const parts = item.split(/\s+as\s+/);
                const name = parts[0].replace(/^type\s+/, '');
                addImport(name, match[2], 'named');
            });
        }

        // Default
        REGEX.import.default.lastIndex = 0;
        while ((match = REGEX.import.default.exec(cleanContent)) !== null) {
            addImport('<default>', match[2], 'default', true);
        }

        // Namespace
        REGEX.import.namespace.lastIndex = 0;
        while ((match = REGEX.import.namespace.exec(cleanContent)) !== null) {
            addImport('*', match[2], 'ns', false, true);
        }

        // Type Named
        REGEX.import.typeNamed.lastIndex = 0;
        while ((match = REGEX.import.typeNamed.exec(cleanContent)) !== null) {
            const list = match[1].split(',').map(s => s.trim()).filter(Boolean);
            list.forEach(item => {
                const parts = item.split(/\s+as\s+/);
                const name = parts[0].replace(/^type\s+/, '');
                addImport(name, match[2], 'named');
            });
        }

        // Dynamic Import
        REGEX.import.dynamic.lastIndex = 0;
        while ((match = REGEX.import.dynamic.exec(cleanContent)) !== null) {
            // Dynamic imports are often default or namespace usage of the module
            addImport('*', match[1], 'dynamic', false, true);
        }

        // Require
        REGEX.import.require.lastIndex = 0;
        while ((match = REGEX.import.require.exec(cleanContent)) !== null) {
            const list = match[1].split(',').map(s => s.trim()).filter(Boolean);
            list.forEach(item => {
                const parts = item.split(/\s*:\s*/);
                const name = parts[0];
                addImport(name, match[2], 'named');
            });
        }

        return { path: filePath, relPath, exports, imports, isEntryPoint };
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
        return null;
    }
}

// Global cache for resolutions to speed up
const resolutionCache = new Map();

function runImportCheck() {
    const brokenImportsPath = path.join(REPO_ROOT, 'broken_imports.json');
    let brokenImports = [];

    try {
        // Run import checker before unused analysis to avoid false positives
        execSync('node tools/validate-imports.js', {
            cwd: REPO_ROOT,
            stdio: 'pipe'
        });
        if (fs.existsSync(brokenImportsPath)) {
            brokenImports = JSON.parse(fs.readFileSync(brokenImportsPath, 'utf8'));
        }
    } catch (error) {
        console.warn('⚠️  check_imports failed or reported issues; continuing unused analysis. Details:', error.message);
        if (fs.existsSync(brokenImportsPath)) {
            brokenImports = JSON.parse(fs.readFileSync(brokenImportsPath, 'utf8'));
        }
    }

    return brokenImports;
}

async function resolveSpecifier(currentFile, specifier) {
    const cacheKey = `${currentFile}|${specifier}`;
    if (resolutionCache.has(cacheKey)) return resolutionCache.get(cacheKey);

    let result = null;

    if (specifier.startsWith('.')) {
        const dir = path.dirname(currentFile);
        const resolvedPath = path.resolve(dir, specifier);

        for (const ext of EXTENSIONS) {
            const tryPath = resolvedPath + ext;
            try {
                const stat = await fs.promises.stat(tryPath);
                if (stat.isFile()) {
                    result = path.relative(path.join(__dirname, '../'), tryPath).replace(/\\/g, '/');
                    break;
                }
            } catch (error) {
                if (process.env.DEBUG) console.debug(`Debug: Failed to check ${tryPath}`, error);
            }

            const tryIdxPath = path.join(resolvedPath, 'index' + ext);
            try {
                const stat = await fs.promises.stat(tryIdxPath);
                if (stat.isFile()) {
                    result = path.relative(path.join(__dirname, '../'), tryIdxPath).replace(/\\/g, '/');
                    break;
                }
            } catch (error) {
                if (process.env.DEBUG) console.debug(`Debug: Failed to check ${tryIdxPath}`, error);
            }
        }

        // Exact match
        if (!result) {
            try {
                const stat = await fs.promises.stat(resolvedPath);
                if (stat.isFile()) result = path.relative(path.join(__dirname, '../'), resolvedPath).replace(/\\/g, '/');
            } catch (error) {
                if (process.env.DEBUG) console.debug(`Debug: Failed to check ${resolvedPath}`, error);
            }
        }

    } else if (specifier.startsWith('@/')) {
        const resolvedPath = path.join(SRC_PATH, specifier.substring(2));
        for (const ext of EXTENSIONS) {
            const tryPath = resolvedPath + ext;
            try {
                const stat = await fs.promises.stat(tryPath);
                if (stat.isFile()) {
                    result = path.relative(path.join(__dirname, '../'), tryPath).replace(/\\/g, '/');
                    break;
                }
            } catch (error) {
                if (process.env.DEBUG) console.debug(`Debug: Failed to check ${tryPath}`, error);
            }

            const tryIdxPath = path.join(resolvedPath, 'index' + ext);
            try {
                const stat = await fs.promises.stat(tryIdxPath);
                if (stat.isFile()) {
                    result = path.relative(path.join(__dirname, '../'), tryIdxPath).replace(/\\/g, '/');
                    break;
                }
            } catch (error) {
                if (process.env.DEBUG) console.debug(`Debug: Failed to check ${tryIdxPath}`, error);
            }
        }

        // Exact match for @/ alias
        if (!result) {
            try {
                const stat = await fs.promises.stat(resolvedPath);
                if (stat.isFile()) result = path.relative(path.join(__dirname, '../'), resolvedPath).replace(/\\/g, '/');
            } catch (error) {
                if (process.env.DEBUG) console.debug(`Debug: Failed to check ${resolvedPath}`, error);
            }
        }
    }

    resolutionCache.set(cacheKey, result);
    return result;
}


async function analyze() {
    console.log('Analyzing codebase health (Async/Parallel)...');
    const startTime = Date.now();

    const brokenImports = runImportCheck();
    if (brokenImports.length) {
        console.log(`⚠️  Import check found ${brokenImports.length} broken imports. Review before deleting anything.`);
    } else {
        console.log('✅ Import check: no broken relative/alias imports detected.');
    }

    const allFiles = await getAllFiles(SRC_PATH);
    console.log(`Found ${allFiles.length} files. Parsing...`);

    const fileData = (await Promise.all(allFiles.map(parseFile))).filter(Boolean);

    const exportMap = new Map();
    const importUsage = new Map();
    const importedFiles = new Set(); // Tracks which files are imported at least once

    // 1. Build Export Map
    fileData.forEach(file => {
        const expSet = new Set();
        file.exports.forEach(e => expSet.add(e.name));
        exportMap.set(file.relPath, expSet);

        if (!importUsage.has(file.relPath)) {
            importUsage.set(file.relPath, new Set());
        }

        // If entry point, mark as "used/imported" so it's not orphaned
        if (file.isEntryPoint) {
            importedFiles.add(file.relPath);
        }
    });

    // 2. Process Imports to Mark Usage
    await Promise.all(fileData.map(async file => {
        await Promise.all(file.imports.map(async imp => {
            const resolvedRelPath = await resolveSpecifier(path.join(__dirname, '../', file.relPath), imp.specifier);

            if (resolvedRelPath) {
                // Mark file as imported
                importedFiles.add(resolvedRelPath);

                if (importUsage.has(resolvedRelPath)) {
                    const usageSet = importUsage.get(resolvedRelPath);
                    if (imp.isNs || imp.kind === 'dynamic') {
                        const targetExports = exportMap.get(resolvedRelPath);
                        if (targetExports) {
                            targetExports.forEach(e => usageSet.add(e));
                        }
                    } else {
                        usageSet.add(imp.name);
                    }
                }
            }
        }));
    }));

    // 3. Find Unused Exports
    const unusedExports = [];
    exportMap.forEach((exports, relPath) => {
        const used = importUsage.get(relPath);
        exports.forEach(expName => {
            if (!used.has(expName)) {
                unusedExports.push({ file: relPath, export: expName });
            }
        });
    });

    // 4. Find Orphaned Files (Never imported, not entry point, not protected)
    const orphanedFiles = [];
    fileData.forEach(file => {
        const isProtected = PROTECTED_EXTENSIONS.some(pExt => file.relPath.endsWith(pExt));
        if (!importedFiles.has(file.relPath) && !isProtected) {
            orphanedFiles.push(file.relPath);
        }
    });

    // 5. Find Files with No Exports (and not entry point)
    const noExportFiles = [];
    fileData.forEach(file => {
        if (file.exports.length === 0 && !file.isEntryPoint) {
            noExportFiles.push(file.relPath);
        }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\nAnalysis complete in ${duration}s.`);
    console.log(`- Files scanned: ${fileData.length}`);
    console.log(`- Unused Exports: ${unusedExports.length}`);
    console.log(`- Orphaned Files: ${orphanedFiles.length}`);
    console.log(`- No-Export Files: ${noExportFiles.length}`);
    console.log(`- Broken Imports: ${brokenImports.length}`);

    // Prepare JSON summary for tooling/IA review
    const summary = {
        filesScanned: fileData.length,
        unusedExports,
        orphanedFiles,
        noExportFiles,
        brokenImports,
        generatedAt: new Date().toISOString()
    };

    if (process.argv.includes('--save-csv')) {
        if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

        let csvContent = 'Type,File,Detail\n';
        unusedExports.forEach(u => csvContent += `Unused Export,${u.file},${u.export}\n`);
        orphanedFiles.forEach(f => csvContent += `Orphaned File,${f},N/A\n`);
        noExportFiles.forEach(f => csvContent += `No Export File,${f},N/A\n`);

        await fs.promises.writeFile(CSV_PATH, csvContent);
        console.log(`Full report saved to ${CSV_PATH}`);
        await fs.promises.writeFile(JSON_PATH, JSON.stringify(summary, null, 2));
        console.log(`JSON report saved to ${JSON_PATH}`);
    } else {
        console.log('\n--- TOP 10 ORPHANED FILES ---');
        orphanedFiles.slice(0, 10).forEach(f => console.log(`[ORPHAN] ${f}`));
        if (orphanedFiles.length > 10) console.log(`...and ${orphanedFiles.length - 10} more`);

        console.log('\n--- TOP 10 UNUSED EXPORTS ---');
        unusedExports.slice(0, 10).forEach(u => console.log(`[UNUSED] ${u.file}  -->  ${u.export}`));
        if (unusedExports.length > 10) console.log(`...and ${unusedExports.length - 10} more`);
        if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
        await fs.promises.writeFile(JSON_PATH, JSON.stringify(summary, null, 2));
    }
}

analyze();
