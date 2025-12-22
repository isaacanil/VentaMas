import { calculateGTIN13CheckDigit, calculateGTIN14CheckDigit } from './digits';

/**
 * Configuraciones de prefijos GS1 por país
 */
export const GS1_PREFIXES = {
  // América
  US: {
    prefix: '0',
    name: 'Estados Unidos y Canadá',
    region: 'América del Norte',
  },
  CA: {
    prefix: '0',
    name: 'Estados Unidos y Canadá',
    region: 'América del Norte',
  },
  MX: { prefix: '750', name: 'México', region: 'América del Norte' },
  DO: { prefix: '746', name: 'República Dominicana', region: 'El Caribe' },
  GT: { prefix: '740', name: 'Guatemala', region: 'América Central' },
  SV: { prefix: '741', name: 'El Salvador', region: 'América Central' },
  HN: { prefix: '742', name: 'Honduras', region: 'América Central' },
  NI: { prefix: '743', name: 'Nicaragua', region: 'América Central' },
  CR: { prefix: '744', name: 'Costa Rica', region: 'América Central' },
  PA: { prefix: '745', name: 'Panamá', region: 'América Central' },
  VE: { prefix: '759', name: 'Venezuela', region: 'América del Sur' },
  CO: { prefix: '770', name: 'Colombia', region: 'América del Sur' },
  UY: { prefix: '773', name: 'Uruguay', region: 'América del Sur' },
  PE: { prefix: '775', name: 'Perú', region: 'América del Sur' },
  BO: { prefix: '777', name: 'Bolivia', region: 'América del Sur' },
  AR: { prefix: '778', name: 'Argentina', region: 'América del Sur' },
  CL: { prefix: '780', name: 'Chile', region: 'América del Sur' },
  PY: { prefix: '784', name: 'Paraguay', region: 'América del Sur' },
  BR: { prefix: '789', name: 'Brasil', region: 'América del Sur' },

  // Europa
  DE: { prefix: '40', name: 'Alemania', region: 'Europa' },
  FR: { prefix: '30', name: 'Francia', region: 'Europa' },
  GB: { prefix: '50', name: 'Reino Unido', region: 'Europa' },
  IT: { prefix: '80', name: 'Italia', region: 'Europa' },
  ES: { prefix: '84', name: 'España', region: 'Europa' },
  NL: { prefix: '87', name: 'Países Bajos', region: 'Europa' },
  AT: { prefix: '90', name: 'Austria', region: 'Europa' },
  CH: { prefix: '76', name: 'Suiza', region: 'Europa' },
  NO: { prefix: '70', name: 'Noruega', region: 'Europa' },
  SE: { prefix: '73', name: 'Suecia', region: 'Europa' },
  DK: { prefix: '57', name: 'Dinamarca', region: 'Europa' },

  // Asia
  JP: { prefix: '45', name: 'Japón', region: 'Asia' },
  CN: { prefix: '690', name: 'China', region: 'Asia' },
  IN: { prefix: '890', name: 'India', region: 'Asia' },
  KR: { prefix: '880', name: 'Corea del Sur', region: 'Asia' },
  SG: { prefix: '888', name: 'Singapur', region: 'Asia' },
  TH: { prefix: '885', name: 'Tailandia', region: 'Asia' },
  VN: { prefix: '893', name: 'Vietnam', region: 'Asia' },

  // Oceanía
  AU: { prefix: '93', name: 'Australia', region: 'Oceanía' },
  NZ: { prefix: '94', name: 'Nueva Zelanda', region: 'Oceanía' },
};

/**
 * Configuraciones de estructura por tamaño de empresa
 */
export const COMPANY_STRUCTURES = {
  large: {
    name: 'Empresa Grande',
    companyPrefixLength: 6,
    itemReferenceLength: 3,
    maxProducts: 999,
    description:
      'Para empresas con pocos productos pero alta identificación global',
  },
  medium: {
    name: 'Empresa Mediana',
    companyPrefixLength: 5,
    itemReferenceLength: 4,
    maxProducts: 9999,
    description: 'Para empresas con catálogos medianos',
  },
  small: {
    name: 'Empresa Pequeña',
    companyPrefixLength: 4,
    itemReferenceLength: 5,
    maxProducts: 99999,
    description: 'Para empresas con grandes catálogos de productos',
  },
};

/**
 * Genera un código GTIN genérico y escalable
 * @param {Object} config - Configuración del código
 * @param {string} config.country - Código de país ISO (ej: 'DO', 'US', 'DE')
 * @param {string} config.companyPrefix - Prefijo de la empresa
 * @param {string} config.itemReference - Referencia del artículo
 * @param {string} [config.format='GTIN13'] - Formato deseado: 'GTIN13', 'GTIN14'
 * @param {string} [config.indicator='0'] - Indicador para GTIN14
 * @returns {string} Código GTIN completo con dígito verificador
 */
export function generateGTIN(config) {
  const {
    country,
    companyPrefix,
    itemReference,
    format = 'GTIN13',
    indicator = '0',
  } = config;

  // Validaciones
  if (!country || !companyPrefix || !itemReference) {
    throw new Error(
      'Faltan parámetros requeridos: country, companyPrefix, itemReference',
    );
  }

  if (!GS1_PREFIXES[country]) {
    throw new Error(
      `País no soportado: ${country}. Usa códigos ISO de 2 letras.`,
    );
  }

  // Validar que sean solo dígitos
  if (!/^\d+$/.test(companyPrefix) || !/^\d+$/.test(itemReference)) {
    throw new Error(
      'companyPrefix e itemReference deben contener solo dígitos',
    );
  }

  const gs1Prefix = GS1_PREFIXES[country].prefix;
  const totalDataLength = 12 - gs1Prefix.length; // GTIN13 sin check digit
  const combinedLength = companyPrefix.length + itemReference.length;

  // Validar longitud total
  if (combinedLength !== totalDataLength) {
    throw new Error(
      `La suma de companyPrefix (${companyPrefix.length}) + itemReference (${itemReference.length}) debe ser ${totalDataLength} para ${country}`,
    );
  }

  // Construir el código base
  let codeBase;

  if (format === 'GTIN14') {
    // GTIN14: Indicador + GS1Prefix + CompanyPrefix + ItemReference
    codeBase = indicator + gs1Prefix + companyPrefix + itemReference;

    if (codeBase.length !== 13) {
      throw new Error(
        `GTIN14 sin check digit debe tener 13 dígitos, tiene ${codeBase.length}`,
      );
    }

    const checkDigit = calculateGTIN14CheckDigit(codeBase);
    return codeBase + checkDigit;
  } else {
    // GTIN13: GS1Prefix + CompanyPrefix + ItemReference
    codeBase = gs1Prefix + companyPrefix + itemReference;

    if (codeBase.length !== 12) {
      throw new Error(
        `GTIN13 sin check digit debe tener 12 dígitos, tiene ${codeBase.length}`,
      );
    }

    const checkDigit = calculateGTIN13CheckDigit(codeBase);
    return codeBase + checkDigit;
  }
}

/**
 * Genera un código GTIN13 (función de conveniencia)
 * @param {string} country - Código de país ISO
 * @param {string} companyPrefix - Prefijo de empresa
 * @param {string} itemReference - Referencia de artículo
 * @returns {string} Código GTIN13 completo
 */
export function generateGTIN13(country, companyPrefix, itemReference) {
  return generateGTIN({
    country,
    companyPrefix,
    itemReference,
    format: 'GTIN13',
  });
}

/**
 * Genera un código GTIN14 (función de conveniencia)
 * @param {string} country - Código de país ISO
 * @param {string} companyPrefix - Prefijo de empresa
 * @param {string} itemReference - Referencia de artículo
 * @param {string} [indicator='0'] - Indicador de empaque
 * @returns {string} Código GTIN14 completo
 */
export function generateGTIN14(
  country,
  companyPrefix,
  itemReference,
  indicator = '0',
) {
  return generateGTIN({
    country,
    companyPrefix,
    itemReference,
    format: 'GTIN14',
    indicator,
  });
}

/**
 * Función de retrocompatibilidad para República Dominicana
 * @deprecated Usa generateGTIN13('DO', companyPrefix, itemReference) en su lugar
 */
export function generateGTIN13RD(companyPrefix, itemReference) {
  console.warn(
    'generateGTIN13RD está deprecada. Usa generateGTIN13("DO", companyPrefix, itemReference)',
  );
  return generateGTIN13('DO', companyPrefix, itemReference);
}

/**
 * Obtiene la configuración recomendada según el número de productos
 * @param {number} expectedProducts - Número esperado de productos
 * @returns {Object} Configuración recomendada
 */
export function getRecommendedStructure(expectedProducts) {
  if (expectedProducts <= 999) return COMPANY_STRUCTURES.large;
  if (expectedProducts <= 9999) return COMPANY_STRUCTURES.medium;
  return COMPANY_STRUCTURES.small;
}

/**
 * Valida la configuración de generación antes de usar
 * @param {Object} config - Configuración a validar
 * @returns {Object} Resultado de validación
 */
export function validateGenerationConfig(config) {
  const { country, companyPrefix, itemReference } = config;
  const errors = [];

  if (!country) errors.push('País requerido');
  else if (!GS1_PREFIXES[country]) errors.push(`País ${country} no soportado`);

  if (!companyPrefix) errors.push('Prefijo de empresa requerido');
  else if (!/^\d+$/.test(companyPrefix))
    errors.push('Prefijo de empresa debe ser numérico');

  if (!itemReference) errors.push('Referencia de artículo requerida');
  else if (!/^\d+$/.test(itemReference))
    errors.push('Referencia de artículo debe ser numérica');

  if (country && companyPrefix && itemReference && GS1_PREFIXES[country]) {
    const gs1Prefix = GS1_PREFIXES[country].prefix;
    const totalDataLength = 12 - gs1Prefix.length;
    const combinedLength = companyPrefix.length + itemReference.length;

    if (combinedLength !== totalDataLength) {
      errors.push(
        `Longitud total debe ser ${totalDataLength}, es ${combinedLength}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestion: errors.length > 0 ? null : getRecommendedStructure(10000), // Default suggestion
  };
}

/**
 * Genera el siguiente número de referencia de artículo
 * @param {number} lastReference - Última referencia utilizada
 * @param {number} digits - Número de dígitos deseados
 * @returns {string} Nueva referencia con padding de ceros
 */
export function generateNextItemReference(lastReference = 0, digits = 5) {
  const next = lastReference + 1;
  return next.toString().padStart(digits, '0');
}

/**
 * Configuraciones para modo de uso interno
 */
export const INTERNAL_MODE_STRUCTURES = {
  standard: {
    name: 'Uso Interno',
    companyPrefixLength: 0, // Sin company prefix ni categorías
    itemReferenceLength: 9, // Todos los dígitos para items
    maxProducts: 999999999, // 999 millones de productos
    description: 'Máxima capacidad de productos para uso interno',
  },
};

/**
 * Genera un código de barras para uso interno (sin restricciones GS1)
 * @param {Object} config - Configuración del código interno
 * @param {string} config.country - Código de país ISO (ej: 'DO', 'US', 'DE')
 * @param {string} [config.categoryPrefix=''] - Prefijo de categoría/departamento (opcional)
 * @param {string} config.itemReference - Referencia del artículo
 * @param {string} [config.format='GTIN13'] - Formato deseado: 'GTIN13', 'GTIN14'
 * @param {string} [config.indicator='0'] - Indicador para GTIN14
 * @returns {string} Código GTIN completo con dígito verificador
 */
export function generateInternalGTIN(config) {
  const {
    country,
    categoryPrefix = '',
    itemReference,
    format = 'GTIN13',
    indicator = '0',
  } = config;

  // Validaciones
  if (!country || !itemReference) {
    throw new Error('Faltan parámetros requeridos: country, itemReference');
  }

  if (!GS1_PREFIXES[country]) {
    throw new Error(
      `País no soportado: ${country}. Usa códigos ISO de 2 letras.`,
    );
  }

  // Validar que sean solo dígitos
  if (categoryPrefix && !/^\d*$/.test(categoryPrefix)) {
    throw new Error('categoryPrefix debe contener solo dígitos');
  }

  if (!/^\d+$/.test(itemReference)) {
    throw new Error('itemReference debe contener solo dígitos');
  }

  const gs1Prefix = GS1_PREFIXES[country].prefix;
  const totalDataLength = 12 - gs1Prefix.length; // GTIN13 sin check digit
  const combinedLength = categoryPrefix.length + itemReference.length;

  // Validar longitud total
  if (combinedLength !== totalDataLength) {
    throw new Error(
      `La suma de categoryPrefix (${categoryPrefix.length}) + itemReference (${itemReference.length}) debe ser ${totalDataLength} para ${country}`,
    );
  }

  // Construir el código base
  let codeBase;

  if (format === 'GTIN14') {
    // GTIN14: Indicador + GS1Prefix + CategoryPrefix + ItemReference
    codeBase = indicator + gs1Prefix + categoryPrefix + itemReference;

    if (codeBase.length !== 13) {
      throw new Error(
        `GTIN14 sin check digit debe tener 13 dígitos, tiene ${codeBase.length}`,
      );
    }

    const checkDigit = calculateGTIN14CheckDigit(codeBase);
    return codeBase + checkDigit;
  } else {
    // GTIN13: GS1Prefix + CategoryPrefix + ItemReference
    codeBase = gs1Prefix + categoryPrefix + itemReference;

    if (codeBase.length !== 12) {
      throw new Error(
        `GTIN13 sin check digit debe tener 12 dígitos, tiene ${codeBase.length}`,
      );
    }

    const checkDigit = calculateGTIN13CheckDigit(codeBase);
    return codeBase + checkDigit;
  }
}

/**
 * Genera un código GTIN13 para uso interno (función de conveniencia)
 * @param {string} country - Código de país ISO
 * @param {string} [categoryPrefix=''] - Prefijo de categoría (opcional)
 * @param {string} itemReference - Referencia de artículo
 * @returns {string} Código GTIN13 completo para uso interno
 */
export function generateInternalGTIN13(
  country,
  categoryPrefix = '',
  itemReference,
) {
  return generateInternalGTIN({
    country,
    categoryPrefix,
    itemReference,
    format: 'GTIN13',
  });
}

/**
 * Función específica para República Dominicana en modo interno
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para uso interno en RD
 */
export function generateInternalGTIN13RD(categoryPrefix = '', itemReference) {
  // Para modo interno, si no hay categoryPrefix, el itemReference debe ser de 9 dígitos
  // Si es más corto, lo rellenamos con ceros a la izquierda
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(9, '0');
    return generateInternalGTIN13('DO', categoryPrefix, paddedItemReference);
  }

  return generateInternalGTIN13('DO', categoryPrefix, itemReference);
}

/**
 * Función específica para Estados Unidos/Canadá
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para Estados Unidos/Canadá
 */
export function generateGTIN13US(categoryPrefix = '', itemReference) {
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(11, '0');
    return generateInternalGTIN13('US', categoryPrefix, paddedItemReference);
  }
  return generateInternalGTIN13('US', categoryPrefix, itemReference);
}

/**
 * Función específica para México
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para México
 */
export function generateGTIN13MX(categoryPrefix = '', itemReference) {
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(9, '0');
    return generateInternalGTIN13('MX', categoryPrefix, paddedItemReference);
  }
  return generateInternalGTIN13('MX', categoryPrefix, itemReference);
}

/**
 * Función específica para Colombia
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para Colombia
 */
export function generateGTIN13CO(categoryPrefix = '', itemReference) {
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(9, '0');
    return generateInternalGTIN13('CO', categoryPrefix, paddedItemReference);
  }
  return generateInternalGTIN13('CO', categoryPrefix, itemReference);
}

/**
 * Función específica para Argentina
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para Argentina
 */
export function generateGTIN13AR(categoryPrefix = '', itemReference) {
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(9, '0');
    return generateInternalGTIN13('AR', categoryPrefix, paddedItemReference);
  }
  return generateInternalGTIN13('AR', categoryPrefix, itemReference);
}

/**
 * Función específica para Chile
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para Chile
 */
export function generateGTIN13CL(categoryPrefix = '', itemReference) {
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(9, '0');
    return generateInternalGTIN13('CL', categoryPrefix, paddedItemReference);
  }
  return generateInternalGTIN13('CL', categoryPrefix, itemReference);
}

/**
 * Función específica para Perú
 * @param {string} [categoryPrefix=''] - Prefijo de categoría/departamento
 * @param {string} itemReference - Referencia del artículo
 * @returns {string} Código GTIN13 completo para Perú
 */
export function generateGTIN13PE(categoryPrefix = '', itemReference) {
  if (!categoryPrefix && itemReference) {
    const paddedItemReference = itemReference.toString().padStart(9, '0');
    return generateInternalGTIN13('PE', categoryPrefix, paddedItemReference);
  }
  return generateInternalGTIN13('PE', categoryPrefix, itemReference);
}
