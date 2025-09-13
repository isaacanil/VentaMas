/**
 * Pruebas de las funciones de análisis de códigos de barras
 * Este archivo puede ser usado para verificar que las funciones funcionen correctamente
 */

import { 
  analyzeBarcodeStructure, 
  getBarcodeInfo, 
  generateCorrectionSuggestions,
  hasCorrectionSuggestions,
  isValidBarcode,
  isGS1RDCode
} from './barcode.js';

// Casos de prueba expandidos
const testCases = [
  // Casos válidos
  { code: '7461234567890', description: 'GTIN-13 válido de RD' },
  { code: '123456789012', description: 'UPC-A válido (12 dígitos)' },
  { code: '12345670', description: 'EAN-8 válido' },
  { code: '00012345678905', description: 'GTIN-14 válido' },
  
  // UPC-E casos
  { code: '0123456', description: 'UPC-E de 7 dígitos' },
  { code: '123456', description: 'UPC-E de 6 dígitos' },
  { code: '01234565', description: 'UPC-E de 8 dígitos' },
  
  // Casos que necesitan corrección
  { code: '746123456789', description: 'RD sin dígito verificador (12 dígitos)' },
  { code: '7461234567891', description: 'RD con dígito verificador incorrecto' },
  { code: '12345', description: 'Código muy corto (5 dígitos)' },
  { code: '746-123-456-789', description: 'Con caracteres no numéricos' },
  { code: '74612345678901234', description: 'Código muy largo (17 dígitos)' },
  { code: '1234567', description: 'EAN-8 sin dígito verificador (7 dígitos)' },
  { code: '12345671', description: 'EAN-8 con dígito verificador incorrecto' },
  { code: '12345678901', description: 'UPC-A sin dígito verificador (11 dígitos)' },
  { code: '123456789013', description: 'UPC-A con dígito verificador incorrecto' },
  
  // Códigos de peso variable
  { code: '2012345678901', description: 'Código de peso variable (20-29)' },
  { code: '2512345000123', description: 'Código de precio variable' },
  
  // Casos especiales
  { code: '', description: 'Código vacío' },
  { code: 'abcdef', description: 'Solo letras' },
  { code: '0123456789012', description: 'GTIN-13 de EE.UU./Canadá' },
  { code: '8901234567890', description: 'GTIN-13 de India' },
  { code: '4901234567893', description: 'GTIN-13 de Japón' },
  
  // Casos edge para GTIN-14
  { code: '1234567890123', description: 'Posible GTIN-14 sin dígito (13 dígitos)' },
  { code: '12345678901234', description: 'GTIN-14 con dígito verificador incorrecto' }
];

/**
 * Función para probar todas las utilidades
 */
export function runBarcodeTests() {
  console.log('🧪 Iniciando pruebas de utilidades de códigos de barras...\n');
  
  testCases.forEach((testCase, index) => {
    console.log(`📋 Prueba ${index + 1}: ${testCase.description}`);
    console.log(`📊 Código: "${testCase.code}"`);
    
    try {
      // Análisis completo
      const analysis = analyzeBarcodeStructure(testCase.code);
      console.log(`✅ Análisis: ${analysis.type || 'Desconocido'}, Válido: ${analysis.isValid}`);
      
      // Información resumida
      const info = getBarcodeInfo(testCase.code);
      console.log(`📄 Info: ${info.message || info.error || 'Sin información'}`);
      
      // Validación simple
      const isValid = isValidBarcode(testCase.code);
      console.log(`✔️ ¿Es válido?: ${isValid}`);
      
      // ¿Es código RD?
      const isRD = isGS1RDCode(testCase.code);
      console.log(`🇩🇴 ¿Es de RD?: ${isRD}`);
      
      // Sugerencias de corrección
      const hasCorrections = hasCorrectionSuggestions(testCase.code);
      console.log(`🔧 ¿Tiene correcciones?: ${hasCorrections}`);
      
      if (hasCorrections) {
        const suggestions = generateCorrectionSuggestions(testCase.code);
        console.log(`💡 Sugerencias (${suggestions.length}):`);
        suggestions.forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion.type}: ${suggestion.code} - ${suggestion.description}`);
        });
      }
      
    } catch (error) {
      console.error(`❌ Error en la prueba: ${error.message}`);
    }
    
    console.log('---\n');
  });
  
  console.log('✅ Pruebas completadas!');
}

// Función para probar un código específico
export function testSpecificCode(code) {
  console.log(`🧪 Probando código específico: "${code}"`);
  
  const analysis = analyzeBarcodeStructure(code);
  const info = getBarcodeInfo(code);
  const suggestions = generateCorrectionSuggestions(code);
  
  return {
    analysis,
    info,
    suggestions,
    summary: {
      isValid: analysis.isValid,
      type: analysis.type,
      country: analysis.country?.country,
      hasCorrections: suggestions.length > 0,
      suggestionsCount: suggestions.length
    }
  };
}

// Exportar para uso en desarrollo
if (typeof window !== 'undefined') {
  window.barcodeTests = {
    runBarcodeTests,
    testSpecificCode,
    testCases
  };
}
