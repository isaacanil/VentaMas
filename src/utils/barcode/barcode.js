/**
 * Sistema modular de códigos de barras - Estilo Firebase v9+
 * Archivo principal con funciones exportadas individualmente
 */

// Re-exportar todas las funciones desde sus módulos específicos
export { 
  GS1_COUNTRY_PREFIXES, 
  PREFIXES_SORTED, 
  GTIN_MULTIPLIERS, 
  UPC_MULTIPLIERS 
} from './lib/constants';

// Geometría y utilidades GS1
export {
  PRINT_DPI,
  GS1_STANDARDS,
  QUIET_ZONE_MULTIPLIER,
  mmToPixels,
  getGS1Geometry,
} from './lib/geometry';

export { 
  calculateGTIN13CheckDigit,
  calculateEAN8CheckDigit, 
  calculateUPCACheckDigit,
  calculateGTIN14CheckDigit
} from './lib/digits';

export { 
  expandUPCEToUPCA 
} from './lib/expansion';

export { 
  isVariableWeightCode, 
  analyzeVariableWeightCode 
} from './lib/weight';

export { 
  identifyCountryByPrefix 
} from './lib/country';

export { 
  analyzeBarcodeStructure 
} from './lib/analyzer';

export { 
  generateCorrectionSuggestions,
  hasCorrectionSuggestions,
  getBestCorrectionSuggestion
} from './lib/suggestions';

export { 
  isValidBarcode,
  getBarcodeInfo,
  isGS1RDCode,
  extractCompanyPrefix,
  extractItemReference
} from './lib/info';

// Nuevas funciones de generación
export { 
  generateGTIN, 
  generateGTIN13, 
  generateGTIN14, 
  generateGTIN13RD,
  generateInternalGTIN,
  generateInternalGTIN13,
  generateInternalGTIN13RD,
  generateGTIN13US,
  generateGTIN13MX,
  generateGTIN13CO,
  generateGTIN13AR,
  generateGTIN13CL,
  generateGTIN13PE,
  GS1_PREFIXES,
  COMPANY_STRUCTURES,
  INTERNAL_MODE_STRUCTURES,
  getRecommendedStructure,
  validateGenerationConfig,
  generateNextItemReference 
} from './lib/generator';
