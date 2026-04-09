import fs from 'fs';

/**
 * Este script analiza la salida de 'tsc --noEmit' para encontrar errores específicos
 * de exportaciones faltantes o propiedades inexistentes.
 */

const LOG_FILE = 'tsc_audit.txt';

async function main() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error(
      `No se encontró el archivo ${LOG_FILE}. Ejecuta 'npm run typecheck > ${LOG_FILE}' primero.`,
    );
    return;
  }

  // Intentamos leer como UTF-8, pero si falla o se ve raro, tsc en Windows suele usar UTF-16LE si se redirige con > en PS
  let rawContent = fs.readFileSync(LOG_FILE);
  let content = '';

  // Check for UTF-16 BOM or null characters (indicative of UTF-16LE)
  if (rawContent[0] === 0xff && rawContent[1] === 0xfe) {
    content = rawContent.toString('utf16le');
  } else if (rawContent.includes(0)) {
    content = rawContent.toString('utf16le');
  } else {
    content = rawContent.toString('utf8');
  }

  const lines = content.split('\n');

  const missingExports = [];
  const propertyErrors = [];

  // Regex más flexible para capturar Property 'x' does not exist on type 'y'
  // Nota: TSC usa comillas simples o dobles dependiendo de la versión/entorno
  const propertyRegex =
    /error TS2339: Property ['"](.+)['"] does not exist on type ['"](.+)['"]\./;
  const fileLineRegex = /^(.+\.tsx?)\((\d+),\d+\):/;

  // Regex para Module '"..."' has no exported member '...'
  const exportRegex =
    /error TS2305: Module .+ has no exported member ['"](.+)['"]\./;

  for (const line of lines) {
    const fileMatch = line.match(fileLineRegex);
    if (!fileMatch) continue;

    const exportMatch = line.match(exportRegex);
    if (exportMatch) {
      missingExports.push({
        file: fileMatch[1],
        line: fileMatch[2],
        member: exportMatch[1],
      });
      continue;
    }

    const propMatch = line.match(propertyRegex);
    if (propMatch) {
      propertyErrors.push({
        file: fileMatch[1],
        line: fileMatch[2],
        prop: propMatch[1],
        type: propMatch[2],
      });
    }
  }

  console.log('\n🔍 --- REPORTE DE ERRORES DE INTEGRACIÓN ---\n');

  if (missingExports.length > 0) {
    console.log('❌ EXPORTACIONES FALTANTES (Broken Imports):');
    missingExports.forEach((err) => {
      console.log(`  - [${err.member}] en ${err.file}:${err.line}`);
    });
    console.log(`Total: ${missingExports.length}\n`);
  }

  if (propertyErrors.length > 0) {
    console.log('⚠️ PROPIEDADES INEXISTENTES (Potential State desync):');
    propertyErrors.forEach((err) => {
      console.log(
        `  - Property '${err.prop}' field missing in type '${err.type}' at ${err.file}:${err.line}`,
      );
    });
    console.log(`Total: ${propertyErrors.length}\n`);
  }

  if (missingExports.length === 0 && propertyErrors.length === 0) {
    console.log(
      '✅ No se detectaron errores críticos de exportación o propiedades en el log.',
    );
  }

  console.log('-------------------------------------------\n');
}

main().catch(console.error);
