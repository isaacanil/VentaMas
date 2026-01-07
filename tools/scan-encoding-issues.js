import fs from 'fs';
import path from 'path';

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.scss'];

// Lista ampliada y ordenada por longitud para priorizar secuencias completas sobre caracteres sueltos
const suspiciousSequences = [
    // Minúsculas comunes
    { seq: 'Ã¡', char: 'á' },
    { seq: 'Ã©', char: 'é' },
    { seq: 'Ã\xad', char: 'í' },
    { seq: 'Ã³', char: 'ó' },
    { seq: 'Ãº', char: 'ú' },
    { seq: 'Ã±', char: 'ñ' },
    // Mayúsculas comunes
    { seq: 'Ã‘', char: 'Ñ' },
    { seq: 'Ã‰', char: 'É' },
    { seq: 'Ã“', char: 'Ó' },
    { seq: 'Ãš', char: 'Ú' },
    // Símbolos
    { seq: 'Â¿', char: '¿' },
    { seq: 'Â¡', char: '¡' },
    // Caracteres de reemplazo genéricos
    { seq: 'ï¿½', char: ' (Replacement Character)' },
    { seq: '\uFFFD', char: ' (Unicode Replacement)' },
    // Secuencias genéricas
    { seq: 'Ã', char: 'Posible fragmento UTF-8 roto (C3)' },
];

const suspiciousRegexes = [
    {
        regex: /[a-zA-ZáéíóúÁÉÍÓÚñÑ]\?[a-z]/g,
        message: 'Posible carácter roto (sustituido por literal "?")'
    }
];

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.vite', 'coverage', '.firebase', '.github', '.storybook', '.tools', '.vscode', 'public'].includes(file)) {
                    walkDir(filePath, fileList);
                }
            } else {
                if (extensions.includes(path.extname(file))) {
                    fileList.push(filePath);
                }
            }
        } catch (e) {
            console.error(`Error leyendo ${filePath}: ${e.message}`);
        }
    });
    return fileList;
}

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');

function searchAndFixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        const errors = [];

        // 1. Revisar secuencias estáticas
        for (const { seq, char } of suspiciousSequences) {
            if (content.includes(seq)) {
                // Si es un fragmento genérico como 'Ã', solo alertar si no hay una secuencia más específica
                if (seq === 'Ã' && (content.includes('Ã¡') || content.includes('Ã©') || content.includes('Ã\xad') || content.includes('Ã³') || content.includes('Ãº') || content.includes('Ã±'))) {
                    continue;
                }

                errors.push({
                    file: filePath,
                    sequence: seq,
                    suspectedChar: char,
                });

                if (fixMode && !char.includes('Posible')) {
                    const re = new RegExp(seq, 'g');
                    newContent = newContent.replace(re, char);
                }
            }
        }

        // 2. Revisar regex
        for (const { regex, message } of suspiciousRegexes) {
            const matches = content.match(regex);
            if (matches) {
                matches.forEach(match => {
                    errors.push({
                        file: filePath,
                        sequence: match,
                        suspectedChar: message,
                    });
                });
            }
        }

        if (fixMode && newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            return { errors, fixed: true };
        }

        return { errors, fixed: false };
    } catch (err) {
        console.error(`Error procesando ${filePath}: ${err.message}`);
        return { errors: [], fixed: false };
    }
}

const rootDir = process.cwd();
console.log('🔍 Buscando problemas de codificación (Mojibake) en:', rootDir);
if (fixMode) {
    console.log('🔧 Modo corrección activado: Se intentará reparar los caracteres rotos.');
}

const files = walkDir(rootDir);
let foundIssues = false;
let fixedFilesCount = 0;

files.forEach(file => {
    if (file.includes('scan-encoding')) return; 

    const { errors, fixed } = searchAndFixFile(file);
    if (errors.length > 0) {
        foundIssues = true;
        console.log(`
📂 Archivo: ${path.relative(rootDir, file)}`);
        errors.forEach(issue => {
            console.log(`   Encontrado '${issue.sequence}' -> ${fixMode && !issue.suspectedChar.includes('Posible') ? 'Corregido a' : 'Posiblemente'} '${issue.suspectedChar}'`);
        });
        if (fixed) fixedFilesCount++;
    }
});

if (!foundIssues) {
    console.log("\n✅ No se encontraron problemas de codificación.");
} else {
    if (fixMode) {
        console.log(`
✨ Se repararon ${fixedFilesCount} archivos.`);
    } else {
        console.log("\n⚠️  Se encontraron problemas. Ejecuta con '--fix' para intentar repararlos.");
    }
}
