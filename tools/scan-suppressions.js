
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', 'src');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Colors
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GRAY = '\x1b[90m';

const PATTERNS = {
    tsNocheck: { regex: /@ts-nocheck/g, label: '@ts-nocheck (File Ignored)', color: RED },
    tsIgnore: { regex: /@ts-ignore/g, label: '@ts-ignore (Line Ignored)', color: YELLOW },
    tsExpectError: { regex: /@ts-expect-error/g, label: '@ts-expect-error', color: BLUE },
    eslintDisableFile: { regex: /\/\*\s*eslint-disable\s*\*\//g, label: 'eslint-disable (File)', color: RED },
    eslintDisableLine: { regex: /eslint-disable-(next-)?line/g, label: 'eslint-disable-line', color: GRAY },
    anyType: { regex: /:\s*any\b/g, label: ': any (Explicit Any)', color: YELLOW },
};

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            if (file.match(/\.(ts|tsx|js|jsx)$/)) {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        }
    });

    return arrayOfFiles;
}

function scanFiles() {
    console.log(`\n${BOLD}🔍 Scanning for Type Suppressions & 'any' usage...${RESET}`);
    console.log(`${GRAY}Target: ${ROOT_DIR}${RESET}\n`);

    const files = getAllFiles(ROOT_DIR);
    let totalFiles = 0;
    let filesWithIssues = 0;

    const stats = {
        tsNocheck: 0,
        tsIgnore: 0,
        tsExpectError: 0,
        eslintDisableFile: 0,
        eslintDisableLine: 0,
        anyType: 0,
    };

    const fileResults = [];

    files.forEach((file) => {
        totalFiles++;
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

        const fileIssues = {};
        let hasIssues = false;

        for (const [key, config] of Object.entries(PATTERNS)) {
            const matches = content.match(config.regex);
            if (matches) {
                fileIssues[key] = matches.length;
                stats[key] += matches.length;
                hasIssues = true;
            }
        }

        if (hasIssues) {
            filesWithIssues++;
            fileResults.push({
                path: relativePath,
                issues: fileIssues,
                file: path.basename(file)
            });
        }
    });

    // Sort by severity (ts-nocheck first, then quantity)
    fileResults.sort((a, b) => {
        if (a.issues.tsNocheck && !b.issues.tsNocheck) return -1;
        if (!a.issues.tsNocheck && b.issues.tsNocheck) return 1;

        const totalA = Object.values(a.issues).reduce((a, b) => a + b, 0);
        const totalB = Object.values(b.issues).reduce((a, b) => a + b, 0);
        return totalB - totalA;
    });

    // Output Report
    console.log(`${BOLD}📊 Found issues in ${filesWithIssues} out of ${totalFiles} files:${RESET}\n`);

    fileResults.forEach((res) => {
        console.log(`${BOLD}${res.path}${RESET}`);
        for (const [key, count] of Object.entries(res.issues)) {
            const config = PATTERNS[key];
            console.log(`  ${config.color}• ${count}x ${config.label}${RESET}`);
        }
        console.log(''); // spacer
    });

    console.log(`${BOLD}📈 Summary Statistics:${RESET}`);
    console.log('----------------------------------------');
    for (const [key, config] of Object.entries(PATTERNS)) {
        const count = stats[key];
        const color = count > 0 ? config.color : GRAY;
        console.log(`${color}${config.label.padEnd(25)}: ${count}${RESET}`);
    }
    console.log('----------------------------------------');

    // Save to file
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    const reportPath = path.join(REPORTS_DIR, 'suppressions-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify({ stats, fileResults }, null, 2));
    console.log(`\n${GRAY}Full JSON report saved to: reports/suppressions-audit.json${RESET}\n`);
}

scanFiles();
