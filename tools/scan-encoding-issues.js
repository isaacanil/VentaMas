import fs from 'fs';
import path from 'path';


const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css'];
const suspiciousSequences = [
    { seq: 'Ã¡', char: 'á' },
    { seq: 'Ã©', char: 'é' },
    { seq: 'Ã\xad', char: 'í' },
    { seq: 'Ã³', char: 'ó' },
    { seq: 'Ãº', char: 'ú' },
    { seq: 'Ã±', char: 'ñ' },
    { seq: 'Ã‘', char: 'Ñ' },
    { seq: 'Â¿', char: '¿' },
    { seq: 'Â¡', char: '¡' },
    { seq: 'Ã', char: 'C3 (Starts UTF-8 sequence for many accented chars)' },
    { seq: 'Â', char: 'C2 (Starts UTF-8 sequence)' },
    { seq: 'ï¿½', char: 'Replacement Character' },
];

function searchFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const errors = [];

        suspiciousSequences.forEach(({ seq, char }) => {
            if (content.includes(seq)) {
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.includes(seq)) {
                        errors.push({
                            file: filePath,
                            line: index + 1,
                            sequence: seq,
                            suspectedChar: char,
                            content: line.trim()
                        });
                    }
                });
            }
        });

        return errors;
    } catch (err) {
        console.error(`Error reading ${filePath}: ${err.message}`);
        return [];
    }
}

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.vite') {
                walkDir(filePath, fileList);
            }
        } else {
            if (extensions.includes(path.extname(file))) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const rootDir = process.cwd();
console.log('Scanning for encoding issues in:', rootDir);
const files = walkDir(rootDir);
let foundIssues = false;

files.forEach(file => {
    // Avoid scanning this script itself or the previous cjs one
    if (file.includes('scan-encoding-issues')) return;

    const issues = searchFile(file);
    if (issues.length > 0) {
        foundIssues = true;
        issues.forEach(issue => {
            console.log(`[SUSPECT] ${issue.file}:${issue.line} - Found '${issue.sequence}' (Possible broken '${issue.suspectedChar}')`);
            console.log(`   Context: ${issue.content.substring(0, 100)}...`);
        });
    }
});

if (!foundIssues) {
    console.log("No obvious encoding issues found.");
}
