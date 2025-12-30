import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR_TO_SCAN = path.join(__dirname, '../src');
const EXTENSIONS_TO_SCAN = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.vue', '.json'];
// Thresholds for coloring (Lines)
const LARGE_FILE_LINES = 300;
const WARNING_FILE_LINES = 150;
// Thresholds for coloring (Size) - e.g. 50KB
const LARGE_FILE_SIZE_KB = 50;

function getAllFiles(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

function getFileStats(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').length;
        return {
            size: stats.size, // bytes
            lines: lines
        };
    } catch (err) {
        console.error(`Error reading file ${filePath}: ${err}`);
        return { size: 0, lines: 0 };
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function diagnose() {
    console.log('📊 Starting file size diagnosis...');
    console.log(`📂 Scanning directory: ${DIR_TO_SCAN}`);

    if (!fs.existsSync(DIR_TO_SCAN)) {
        console.error(`Directory not found: ${DIR_TO_SCAN}`);
        return;
    }

    const allFiles = getAllFiles(DIR_TO_SCAN);
    const fileStats = [];

    allFiles.forEach(file => {
        const ext = path.extname(file);
        if (EXTENSIONS_TO_SCAN.includes(ext)) {
            const stats = getFileStats(file);
            fileStats.push({
                file: path.relative(path.join(__dirname, '..'), file),
                lines: stats.lines,
                size: stats.size
            });
        }
    });

    // Sort by size descending (User asked for size)
    // You could switch this to sort by lines if preferred
    fileStats.sort((a, b) => b.size - a.size);

    console.log('\n🏆 Top 50 Largest Files (by Size):');
    console.log('------------------------------------------------------------------------------------------------');
    console.log(
        padRight('File Name', 40) + ' | ' +
        padRight('Size', 10) + ' | ' +
        padRight('Lines', 6) + ' | ' +
        'Path'
    );
    console.log('------------------------------------------------------------------------------------------------');

    fileStats.slice(0, 50).forEach(stat => {
        let color = '';
        const reset = '\x1b[0m';
        const kbSize = stat.size / 1024;
        const fileName = path.basename(stat.file);

        // Color logic: Red if very large size OR very many lines
        if (kbSize >= LARGE_FILE_SIZE_KB || stat.lines >= LARGE_FILE_LINES) {
            color = '\x1b[31m'; // Red
        } else if (kbSize >= LARGE_FILE_SIZE_KB / 2 || stat.lines >= WARNING_FILE_LINES) {
            color = '\x1b[33m'; // Yellow
        }

        // Make path clickable in VS Code terminal (convert Windows backslashes to forward slashes)
        const absolutePath = path.resolve(path.join(__dirname, '..'), stat.file).replace(/\\/g, '/');
        const clickablePath = `\x1b]8;;file:///${absolutePath}\x1b\\${stat.file}\x1b]8;;\x1b\\`;

        console.log(
            `${color}${padRight(fileName, 40)} | ${padRight(formatBytes(stat.size), 10)} | ${padRight(stat.lines.toString(), 6)} | ${clickablePath}${reset}`
        );
    });

    console.log('------------------------------------------------------------------------------------------------');
    console.log(`Total files scanned: ${fileStats.length}`);
}

function padRight(str, len) {
    if (str.length > len) {
        return str.substring(0, len - 3) + '...';
    }
    return str + " ".repeat(len - str.length);
}

diagnose();
