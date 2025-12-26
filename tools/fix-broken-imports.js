import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_PATH = path.join(__dirname, '../src');

// -----------------------------------------------------------------------------
// 🟢 CONFIGURATION & RULES
// Add your regex rules here to batch process fixes.
// -----------------------------------------------------------------------------
const BUILT_IN_RULES = [
    {
        name: 'Fix "formatPricefrom" typo',
        pattern: /import\s+\{\s*formatPricefrom\s+["']([^"'\r\n]+)["']/,
        replacement: "import { formatPrice } from '@/utils/format';"
    },
    {
        name: 'Fix "formatPricefrom" cutoff line',
        pattern: /import\s+\{\s*formatPricefrom\s+["']([^"'\r\n]*)((\r?\n)|$)/,
        replacement: "import { formatPrice } from '@/utils/format';\n"
    },
    // Example of a generic rule:
    // {
    //   name: 'Replace oldLib with newLib',
    //   pattern: /from ['"]oldLib['"]/,
    //   replacement: "from 'newLib'"
    // }
];

// -----------------------------------------------------------------------------
// 🛠 UTILITIES
// -----------------------------------------------------------------------------

function getFiles(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath, extensions));
        } else {
            if (extensions.some(ext => file.endsWith(ext))) {
                results.push(filePath);
            }
        }
    });
    return results;
}

// -----------------------------------------------------------------------------
// 🚀 MAIN LOGIC
// -----------------------------------------------------------------------------

const args = process.argv.slice(2);
let rules = [...BUILT_IN_RULES];

// Support CLI arguments for one-off fixes
// Usage: node tools/fix-broken-imports.js "badPattern" "newString"
if (args.length >= 2) {
    console.log('✨ Running in CLI single-mode');
    const [patternStr, replStr] = args;
    rules = [{
        name: 'CLI Argument Fix',
        pattern: new RegExp(patternStr),
        replacement: replStr
    }];
}

console.log(`🔎 Scanning src/ for ${rules.length} replacement rules...`);

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const files = getFiles(SRC_PATH, extensions);

let totalFixedFiles = 0;


files.forEach(file => {
    try {
        const originalContent = fs.readFileSync(file, 'utf8');
        let newContent = originalContent;
        let fileChanged = false;

        rules.forEach(rule => {
            if (rule.pattern.test(newContent)) {
                // Determine if we need global replacement or single
                // If the regex has 'g' flag, it replaces all. If not, it replaces first.
                // We construct a new RegExp with 'g' if the user didn't provide one, 
                // but usually for code fixes we want to be safe. 
                // replace() with string regex only replaces first occurrence unless global flag is set.

                // For simplicity in this script, we'll try to replace all instances if possible
                // or just follow the native replace behavior of the regex provided.

                const matches = newContent.match(rule.pattern);
                if (matches) {
                    // Using split/join or replaceAll is safer for strings, but for regex we use replace
                    // If the rule.pattern is a global regex, replace works globally.
                    // If it's not, we might only fix one. 
                    // Let's create a global version of the regex for maximum utility if it's not already.

                    let regex = rule.pattern;
                    if (!regex.flags.includes('g')) {
                        regex = new RegExp(regex.source, regex.flags + 'g');
                    }

                    const previousContent = newContent;
                    newContent = newContent.replace(regex, rule.replacement);

                    if (newContent !== previousContent) {
                        fileChanged = true;
                        // console.log(`   [${rule.name}] Applied in ${path.relative(SRC_PATH, file)}`);
                    }
                }
            }
        });

        if (fileChanged) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`✅ Fixed: ${path.relative(SRC_PATH, file)}`);
            totalFixedFiles++;
        }

    } catch (err) {
        console.error(`❌ Error processing ${file}:`, err);
    }
});

console.log(`\n🎉 Done. Modified ${totalFixedFiles} files.`);
if (args.length === 0) {
    console.log('💡 Tip: You can run this script with arguments for quick fixes:');
    console.log('   node tools/fix-broken-imports.js "WrongComponent" "RightComponent"');
}
