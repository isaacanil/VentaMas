import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../reports');
const INPUT_FILE = path.join(REPORTS_DIR, 'lint-report.txt');
const MAX_PER_FILE = 10;

async function splitByType() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`[X] Error: Input file not found: ${INPUT_FILE}`);
        return;
    }

    console.log('[*] Processing lint report (Streaming)...');

    // We will hold errors in memory to group them.
    // NOTE: If the report is massive (GBs), we would need a database.
    // But for typical lint reports (MBs), holding objects is fine, we just save on the initial string read.
    const errors = [];

    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // Parsing State
    let currentFile = '';
    let currentIssue = null;
    let bufferContext = false;

    const lineRegex = /^\s+(\d+):(\d+)\s+(error|warning)\s+(.+)/;

    for await (const line of rl) {
        // 1. Detect File Header
        if (line.match(/^C:\\.*\.(jsx?|tsx?)$/) || line.match(/^\/.*\.(jsx?|tsx?)$/)) {
            currentFile = line.trim();
            bufferContext = false;
            currentIssue = null;
            continue;
        }

        // 2. Detect Issue
        const match = line.match(lineRegex);
        if (match) {
            const [, lineNum, colNum, severity, rawMessage] = match;

            // Extract rule
            let rule = 'unknown-rule';
            let message = rawMessage;
            const ruleMatch = rawMessage.match(new RegExp('\\s+([a-z0-9-/@]+)$', 'i'));
            if (ruleMatch) {
                rule = ruleMatch[1].trim();
                message = rawMessage.replace(ruleMatch[0], '').trim();
            }

            // Push previous issue if exists
            if (currentIssue) {
                // we are done with previous issue
                errors.push(currentIssue);
            }

            currentIssue = {
                file: currentFile,
                line: lineNum,
                column: colNum,
                severity,
                message,
                rule,
                contextArr: [] // accumulate context lines
            };
            bufferContext = true;
            continue;
        }

        // 3. Accumulate Context
        if (bufferContext && currentIssue) {
            // Stop buffering if we hit a file header (handled above) or empty line?
            // Usually context is indented code.
            if (line.trim() !== '') {
                currentIssue.contextArr.push(line);
            } else {
                // Empty line might act as delimiter, but some code has empty lines.
                // We'll keep grabbing until next issue or file.
            }
        }
    }

    // Push last issue
    if (currentIssue) errors.push(currentIssue);

    console.log(`[OK] Found ${errors.length} issues.`);

    // --- Generation Phase (Existing Logic) ---
    const byTypeDir = path.join(REPORTS_DIR, 'by-type');
    if (fs.existsSync(byTypeDir)) fs.rmSync(byTypeDir, { recursive: true, force: true });
    fs.mkdirSync(byTypeDir, { recursive: true });
    fs.mkdirSync(path.join(byTypeDir, 'errors'));
    fs.mkdirSync(path.join(byTypeDir, 'warnings'));

    const bySeverity = { error: [], warning: [] };
    errors.forEach(e => {
        if (bySeverity[e.severity]) bySeverity[e.severity].push(e);
    });

    ['error', 'warning'].forEach(sev => {
        const issues = bySeverity[sev];
        if (issues.length === 0) return;

        const byRule = {};
        issues.forEach(i => {
            if (!byRule[i.rule]) byRule[i.rule] = [];
            byRule[i.rule].push(i);
        });

        const sortedRules = Object.keys(byRule).sort((a, b) => byRule[b].length - byRule[a].length);

        sortedRules.forEach(rule => {
            const ruleIssues = byRule[rule];
            const safeRuleName = rule.replace(/[\\/:*?"<>|]/g, '-');
            const targetDir = path.join(byTypeDir, sev + 's');

            const totalParts = Math.ceil(ruleIssues.length / MAX_PER_FILE);

            for (let p = 0; p < totalParts; p++) {
                const chunk = ruleIssues.slice(p * MAX_PER_FILE, (p + 1) * MAX_PER_FILE);
                const filename = totalParts > 1 ? `${safeRuleName}-part-${p + 1}.txt` : `${safeRuleName}.txt`;

                let output = `RULE: ${rule}\nSEVERITY: ${sev}\nISSUES: ${chunk.length} (Total: ${ruleIssues.length})\n${'='.repeat(50)}\n\n`;

                const byFile = {};
                chunk.forEach(c => {
                    if (!byFile[c.file]) byFile[c.file] = [];
                    byFile[c.file].push(c);
                });

                Object.keys(byFile).forEach(f => {
                    output += `FILE: ${path.basename(f)}\nPath: ${f}\n`;
                    byFile[f].forEach(issue => {
                        output += `  [line ${issue.line}:${issue.column}] ${issue.message}\n`;
                        if (issue.contextArr.length) output += `    Context:\n${issue.contextArr.join('\n')}\n`;
                    });
                    output += '\n';
                });

                fs.writeFileSync(path.join(targetDir, filename), output);
            }
            console.log(`  [+] ${sev}/${safeRuleName} (${ruleIssues.length})`);
        });
    });
}

splitByType();
