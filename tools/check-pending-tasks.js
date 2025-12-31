import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PENDING_DIR = path.join(__dirname, '../pending');
// const DELAY = 20000; // 20 seconds, matching the original script

console.log('Checking for pending tasks...');

if (!fs.existsSync(PENDING_DIR)) {
    console.log('No "pending" directory found.');
    process.exit(0);
}

// In a real environment, we might want to launch an editor or show a notification.
// For this Node version, we'll simply list the pending files found.

try {
    const files = fs.readdirSync(PENDING_DIR);
    if (files.length === 0) {
        console.log('No pending files found.');
    } else {
        console.log('Pending files found:');
        files.forEach(file => console.log(` - ${file}`));

        // Original script logic involved launching a GUI dialog.
        // Here we simply log the finding. 
        // To actually "open" them, one would run `code pending/filename` manually or similar.
        console.log(`\nTo view these, check the directory: ${PENDING_DIR}`);
    }
} catch (error) {
    console.error('Error reading pending directory:', error);
}
