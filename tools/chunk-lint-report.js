import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../reports');
const INPUT_FILE = path.join(REPORTS_DIR, 'lint-report.txt');
const BATCH_SIZE = 10;

async function splitReport() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`[X] Error: Input file not found: ${INPUT_FILE}`);
        return;
    }

    console.log('[*] Batched splitting of lint report (Streaming)...');

    // Errors array, streaming input
    const errors = [];
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

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

            let rule = '';
            let message = rawMessage;
            const ruleMatch = rawMessage.match(new RegExp('\\s+([a-z0-9-/@]+)$', 'i'));
            if (ruleMatch) {
                rule = ruleMatch[1].trim();
                message = rawMessage.replace(ruleMatch[0], '').trim();
            }

            if (currentIssue) errors.push(currentIssue);

            currentIssue = {
                file: currentFile,
                line: lineNum,
                column: colNum,
                severity,
                message,
                rule,
                contextArr: []
            };
            bufferContext = true;
            continue;
        }

        // 3. Context
        if (bufferContext && currentIssue) {
            if (line.trim() !== '') {
                currentIssue.contextArr.push(line);
            }
        }
    }
    if (currentIssue) errors.push(currentIssue);

    const batchesDir = path.join(REPORTS_DIR, 'batches');
    if (fs.existsSync(batchesDir)) fs.rmSync(batchesDir, { recursive: true, force: true });
    fs.mkdirSync(batchesDir, { recursive: true });

    const totalBatches = Math.ceil(errors.length / BATCH_SIZE);

    for (let b = 0; b < totalBatches; b++) {
        const chunk = errors.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        const batchName = `batch-${String(b + 1).padStart(3, '0')}.txt`;

        let output = `BATCH ${b + 1} of ${totalBatches}\nISSUES: ${chunk.length}\n${'='.repeat(50)}\n\n`;

        chunk.forEach(issue => {
            output += `FILE: ${issue.file}\n`;
            output += `  [${issue.severity.toUpperCase()}] ${issue.message} (${issue.rule})\n`;
            output += `  Location: ${issue.line}:${issue.column}\n`;
            if (issue.contextArr.length) output += `  Context:\n${issue.contextArr.join('\n')}\n`;
            output += `\n${'-'.repeat(30)}\n\n`;
        });

        fs.writeFileSync(path.join(batchesDir, batchName), output);
    }

    console.log(`[OK] Created ${totalBatches} batches in ${batchesDir}`);
}

splitReport();
