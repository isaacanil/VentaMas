import fs from 'fs';
import path from 'path';

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css'];

// Lista ampliada y ordenada por longitud para priorizar secuencias completas sobre caracteres sueltos
const suspiciousSequences = [
    // Minúsculas comunes
    { seq: 'Ã¡', char: 'á' },
    { seq: 'Ã©', char: 'é' },
    { seq: 'Ã\xad', char: 'í' }, // \xad es un guion suave, a veces invisible
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
    // Caracteres de reemplazo genéricos (cuando la codificación falló catastróficamente)
    { seq: 'ï¿½', char: ' (Replacement Character)' },
    { seq: '\uFFFD', char: ' (Unicode Replacement)' },
    // Secuencias genéricas (Dejar al final para evitar ruido si ya se detectó la completa)
    { seq: 'Ã', char: 'Posible fragmento UTF-8 roto (C3)' },
    // { seq: 'Â', char: 'Posible fragmento UTF-8 roto (C2)' }, // Comentado: 'Â' es muy común en copyright legal (Â©) y genera ruido.
];

// Nuevos patrones para detectar literales "?" que reemplazaron a carácteres con acento
const suspiciousRegexes = [
    {
        regex: /[a-zA-ZáéíóúÁÉÍÓÚñÑ]\?[a-z]/g,
        message: 'Posible carácter roto (sustituido por literal "?")'
    }
];

function searchFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const errors = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // 1. Revisar secuencias estáticas
            for (const { seq, char } of suspiciousSequences) {
                if (line.includes(seq)) {
                    errors.push({
                        file: filePath,
                        line: index + 1,
                        sequence: seq,
                        suspectedChar: char,
                        content: line.trim()
                    });
                }
            }

            // 2. Revisar regex (para casos como Acci?n)
            for (const { regex, message } of suspiciousRegexes) {
                const matches = line.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        errors.push({
                            file: filePath,
                            line: index + 1,
                            sequence: match,
                            suspectedChar: message,
                            content: line.trim()
                        });
                    });
                }
            }
        });

        return errors;
    } catch (err) {
        console.error(`Error leyendo ${filePath}: ${err.message}`);
        return [];
    }
}

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                // Ignorar carpetas pesadas o de sistema
                if (!['node_modules', '.git', 'dist', 'build', '.vite', 'coverage'].includes(file)) {
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

const rootDir = process.cwd();
console.log('🔍 Buscando problemas de codificación (Mojibake) en:', rootDir);
const files = walkDir(rootDir);
let foundIssues = false;

files.forEach(file => {
    if (file.includes('scan-encoding')) return; // Ignorarse a sí mismo

    const issues = searchFile(file);
    if (issues.length > 0) {
        foundIssues = true;
        console.log(`\n📂 Archivo: ${path.relative(rootDir, file)}`);
        issues.forEach(issue => {
            console.log(`   Línea ${issue.line}: Encontrado '${issue.sequence}' -> Posiblemente sea '${issue.suspectedChar}'`);
            console.log(`   Code: ...${issue.content.substring(0, 80)}...`);
        });
    }
});

if (!foundIssues) {
    console.log("\n✅ No se encontraron problemas de codificación obvios.");
} else {
    console.log("\n⚠️  Se encontraron archivos corruptos. Revisa la lista arriba.");
}