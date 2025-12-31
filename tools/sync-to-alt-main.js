import { execSync } from 'child_process';
import readline from 'readline';

// --- Colors for output ---
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function exec(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        console.error(error);
        return null;
    }
}

function execWithOutput(command) {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

console.log(`${colors.blue}🚀 Detectando rama actual...${colors.reset}`);
const currentBranch = exec('git symbolic-ref --short HEAD');

if (!currentBranch) {
    console.error(`${colors.red}❌ Error: No se pudo determinar la rama actual.${colors.reset}`);
    process.exit(1);
}

console.log(`${colors.green}👉 Rama actual detectada:${colors.reset} ${colors.yellow}${currentBranch}${colors.reset}`);

// Check for 'alt' remote
const remotes = exec('git remote');
if (!remotes || !remotes.split('\n').includes('alt')) {
    console.log(`${colors.red}❌ No se encontró el remote 'alt'.${colors.reset}`);
    console.log(`${colors.yellow}👉 Añádelo con:${colors.reset} git remote add alt <URL-del-repositorio>`);
    process.exit(1);
}

// Confirm action
console.log("");
rl.question(`⚠️  Esto eliminará TODAS las ramas remotas en 'alt' y subirá '${currentBranch}' como 'main'. ¿Continuar? (y/n): `, (answer) => {
    if (answer.toLowerCase() !== 'y') {
        console.log(`${colors.red}❌ Operación cancelada.${colors.reset}`);
        rl.close();
        process.exit(0);
    }

    try {
        console.log("");
        console.log(`${colors.blue}🧹 Eliminando ramas remotas existentes en 'alt'...${colors.reset}`);

        exec('git fetch alt --prune');

        // List remote branches
        const lsRemote = exec('git ls-remote --heads alt');
        if (lsRemote) {
            const branches = lsRemote.split('\n')
                .map(line => line.split('\t')[1])
                .filter(ref => ref && ref.startsWith('refs/heads/'))
                .map(ref => ref.replace('refs/heads/', ''));

            for (const branch of branches) {
                console.log(`   🗑️  Eliminando rama remota: ${colors.yellow}${branch}${colors.reset}`);
                // We use execWithOutput or just ignore error with try-catch
                try {
                    exec(`git push alt --delete "${branch}"`);
                } catch (e) {
                    console.error(`(Error deleting ${branch}, possibly already gone)`);
                    console.error(e);
                }
            }
        } else {
            console.log("   (No hay ramas remotas para eliminar)");
        }

        // Temp branch logic
        const tempBranch = "__alt_temp_push__";
        exec(`git branch -f "${tempBranch}" "${currentBranch}"`);

        console.log("");
        console.log(`${colors.blue}⬆️  Subiendo '${colors.yellow}${currentBranch}${colors.blue}' como 'main' al remote 'alt'...${colors.reset}`);

        execWithOutput(`git push alt "${tempBranch}:main" --force`);

        // Clean up temp branch
        exec(`git branch -D "${tempBranch}"`);

        console.log("");
        console.log(`${colors.green}✅ Proceso completado exitosamente.${colors.reset}`);
        console.log(`${colors.green}   • '${colors.yellow}${currentBranch}${colors.green}' se subió como 'main' a 'alt'.${colors.reset}`);
        console.log(`${colors.green}   • Todas las ramas remotas previas en 'alt' fueron eliminadas.${colors.reset}`);
        console.log("");
        console.log(`${colors.blue}💡 Cuando Codex haya terminado, puedes traer los cambios así:${colors.reset}`);
        console.log(`${colors.yellow}   git fetch alt main${colors.reset}`);
        console.log(`${colors.yellow}   git merge alt/main${colors.reset}`);
        console.log("");

    } catch (err) {
        console.error(`${colors.red}❌ Un error ocurrió durante el proceso:${colors.reset}`, err);
    } finally {
        rl.close();
    }
});
