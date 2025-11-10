 
// Prueba de funciones de generación de códigos de barras
import { 
  generateGTIN13, 
  generateGTIN,
  GS1_PREFIXES,
  validateGenerationConfig,
  isGS1RDCode 
} from './utils/barcode/barcode';

console.log('🧪 Probando sistema de códigos de barras...');

// Prueba 1: Generación básica para RD
try {
  const rdCode = generateGTIN13('DO', '123456', '789');
  console.log('✅ RD GTIN13:', rdCode);
  
  // Verificar que es un código RD válido
  const isRD = isGS1RDCode(rdCode);
  console.log('✅ Es código RD:', isRD);
} catch (error) {
  console.error('❌ Error generando RD:', error.message);
}

// Prueba 2: Generación para México
try {
  const mxCode = generateGTIN13('MX', '123', '456789');
  console.log('✅ MX GTIN13:', mxCode);
} catch (error) {
  console.error('❌ Error generando MX:', error.message);
}

// Prueba 3: Generación con validación
try {
  const config = {
    country: 'US',
    companyPrefix: '12345',
    itemReference: '67890',
    format: 'GTIN13'
  };
  
  const validation = validateGenerationConfig(config);
  if (validation.isValid) {
    const usCode = generateGTIN(config);
    console.log('✅ US GTIN13:', usCode);
  } else {
    console.log('⚠️ Configuración inválida:', validation.errors);
  }
} catch (error) {
  console.error('❌ Error con validación:', error.message);
}

// Prueba 4: Ver países disponibles
console.log('🌍 Países disponibles:');
Object.keys(GS1_PREFIXES).slice(0, 5).forEach(country => {
  const info = GS1_PREFIXES[country];
  console.log(`${country}: ${info.name} (${info.prefix})`);
});

console.log('🧪 Pruebas completadas');
/* eslint-env node */
