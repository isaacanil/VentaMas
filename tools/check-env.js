import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Configuración de archivos por defecto
const ENV_FILE = '.env';
const ENV_EXAMPLE_FILE = '.env.example';

function parseEnv(content) {
  const keys = new Set();
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    // Ignorar comentarios y líneas vacías
    if (!trimmed || trimmed.startsWith('#')) return;

    // Obtener la clave (todo antes del primer =)
    const match = trimmed.match(/^([^=]+)=?/);
    if (match) {
      keys.add(match[1].trim());
    }
  });
  return keys;
}

function checkEnv() {
  const envPath = path.join(ROOT_DIR, ENV_FILE);
  const examplePath = path.join(ROOT_DIR, ENV_EXAMPLE_FILE);

  console.log(`🔍 Checking environment variables...`);

  if (!fs.existsSync(examplePath)) {
    console.warn(
      `⚠️  Warning: No ${ENV_EXAMPLE_FILE} found to compare against.`,
    );
    console.log(
      `💡 Tip: Create a ${ENV_EXAMPLE_FILE} so the team knows which variables are required.`,
    );
    return;
  }

  if (!fs.existsSync(envPath)) {
    console.error(`❌ Error: No ${ENV_FILE} file found.`);
    console.log(
      `👉 Please copy ${ENV_EXAMPLE_FILE} to ${ENV_FILE} and fill in your values.`,
    );
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const exampleContent = fs.readFileSync(examplePath, 'utf8');

  const envKeys = parseEnv(envContent);
  const exampleKeys = parseEnv(exampleContent);

  const missingKeys = [];
  exampleKeys.forEach((key) => {
    if (!envKeys.has(key)) {
      missingKeys.push(key);
    }
  });

  if (missingKeys.length > 0) {
    console.error(`\n❌ Missing environment variables in ${ENV_FILE}:`);
    missingKeys.forEach((key) => {
      console.error(`   - ${key}`);
    });
    console.log(`\n👉 Please add them to your ${ENV_FILE} file.`);
    process.exit(1);
  } else {
    console.log(
      `✅ All ${exampleKeys.size} variables from ${ENV_EXAMPLE_FILE} are present in ${ENV_FILE}.`,
    );
  }

  // Opcional: Avisar si hay variables en local que no estan en example (podria ser "desordenado" pero no critico)
  const extraKeys = [];
  envKeys.forEach((key) => {
    if (!exampleKeys.has(key)) {
      extraKeys.push(key);
    }
  });

  if (extraKeys.length > 0) {
    // Solo como aviso info/debug
    // console.log(`ℹ️  Note: You have ${extraKeys.length} extra variables in ${ENV_FILE} not in ${ENV_EXAMPLE_FILE}.`);
  }
}

checkEnv();
