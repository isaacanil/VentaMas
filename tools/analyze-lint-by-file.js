import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');
const JSON_REPORT = path.join(REPORTS_DIR, 'lint-diagnose.json');

// Color constants
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';

function padRight(str, len) {
    if (str.length > len) {
        return str.substring(0, len - 3) + '...';
    }
    return str + " ".repeat(len - str.length);
}

function analyzeLintByFile() {
    console.log(`\n${BLUE}${BOLD}� Starting ESLint Stats by file...${RESET}`);
    console.log(`${BLUE}📂 Working directory: ${ROOT_DIR}${RESET}`);

    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    try {
        console.log(`${BLUE}[1/2] Running ESLint (this may take a minute)...${RESET}`);
        // We use a high max-warnings to ensure it doesn't fail based on count, 
        // and we wrap in try-catch because ESLint returns non-zero if issues are found.
        execSync(`npx eslint . --format json --output-file "${JSON_REPORT}" --cache`, {
            cwd: ROOT_DIR,
            stdio: 'ignore'
        });
    } catch (e) {
        if (e.status) {
            console.log(`${YELLOW}ℹ️  ESLint finished with some issues (Exit Code: ${e.status}). Parsing results...${RESET}`);
        } else {
            console.error(`${RED}❌ Unexpected error running ESLint: ${e.message}${RESET}`);
        }
    }

    if (!fs.existsSync(JSON_REPORT)) {
        console.error(`${RED}❌ Error: ESLint report was not generated. Check if you have ESLint configured correctly.${RESET}`);
        return;
    }

    console.log(`${BLUE}[2/2] Parsing results and generating report...${RESET}`);

    let results;
    try {
        const reportContent = fs.readFileSync(JSON_REPORT, 'utf8');
        results = JSON.parse(reportContent);
    } catch (e) {
        console.error(`${RED}❌ Error parsing ESLint JSON report: ${e.message}${RESET}`);
        return;
    }

    // Process results
    const fileStats = results
        .filter(r => r.errorCount > 0 || r.warningCount > 0)
        .map(r => ({
            filePath: r.filePath,
            relativePath: path.relative(ROOT_DIR, r.filePath),
            fileName: path.basename(r.filePath),
            errors: r.errorCount,
            warnings: r.warningCount,
            total: r.errorCount + r.warningCount
        }));

    // Sort by total issues descending
    fileStats.sort((a, b) => b.total - a.total);

    console.log(`\n${BLUE}${BOLD}🏆 Top Files with Most Lint Issues:${RESET}`);
    console.log('------------------------------------------------------------------------------------------------');
    console.log(
        padRight('File Name', 40) + ' | ' +
        padRight('Errors', 8) + ' | ' +
        padRight('Warns', 8) + ' | ' +
        padRight('Total', 8) + ' | ' +
        'Relative Path'
    );
    console.log('------------------------------------------------------------------------------------------------');

    fileStats.slice(0, 50).forEach(stat => {
        let nameColor = RESET;
        if (stat.errors > 0) {
            nameColor = RED;
        } else if (stat.warnings > 0) {
            nameColor = YELLOW;
        }

        // Terminal clickable path format
        const absolutePath = stat.filePath.replace(/\\/g, '/');
        const clickablePath = `\x1b]8;;file:///${absolutePath}\x1b\\${stat.relativePath}\x1b]8;;\x1b\\`;

        console.log(
            `${nameColor}${padRight(stat.fileName, 40)}${RESET} | ` +
            `${stat.errors > 0 ? RED : RESET}${padRight(stat.errors.toString(), 8)}${RESET} | ` +
            `${stat.warnings > 0 ? YELLOW : RESET}${padRight(stat.warnings.toString(), 8)}${RESET} | ` +
            `${BOLD}${padRight(stat.total.toString(), 8)}${RESET} | ` +
            `${clickablePath}`
        );
    });

    console.log('------------------------------------------------------------------------------------------------');

    // Grand totals
    const grandTotalErrors = results.reduce((sum, s) => sum + s.errorCount, 0);
    const grandTotalWarnings = results.reduce((sum, s) => sum + s.warningCount, 0);
    const filesWithIssues = fileStats.length;
    const cleanFiles = results.length - filesWithIssues;

    console.log(`\n${BOLD}Summary:${RESET}`);
    console.log(`${BLUE}📋 Files scanned:${RESET} ${results.length}`);
    console.log(`${GREEN}✅ Clean files:${RESET} ${cleanFiles}`);
    console.log(`${YELLOW}⚠️  Files with issues:${RESET} ${filesWithIssues}`);
    console.log(`${RED}❌ Total Errors:${RESET} ${grandTotalErrors}`);
    console.log(`${YELLOW}🔸 Total Warnings:${RESET} ${grandTotalWarnings}`);
    console.log(`${BOLD}🔹 Grand Total Issues:${RESET} ${grandTotalErrors + grandTotalWarnings}`);

    console.log(`\n${BLUE}💡 Report saved to: ${JSON_REPORT}${RESET}\n`);
}

analyzeLintByFile();
