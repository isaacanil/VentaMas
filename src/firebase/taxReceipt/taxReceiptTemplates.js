/**
 * Plantillas predefinidas de comprobantes fiscales para diferentes países
 *
 * Este archivo contiene formatos comunes de comprobantes fiscales organizados por país,
 * lo que facilita a los usuarios configurar rápidamente sus comprobantes fiscales según
 * los requisitos de su país.
 */

// Filtro temporal: solo tipos B serie 01, 02 y 15 en República Dominicana
const _B_SERIES_CODES_DO = ['01', '02', '15'];

export const countryComprobantes = {
  DO: {
    countryName: 'República Dominicana',
    templates: [
      {
        name: 'CONSUMIDOR FINAL',
        type: 'B',
        serie: '02',
        sequence: 0,
        sequenceLength: 8,
        increase: 1,
        quantity: 2000,
        description: 'Comprobante para consumidores finales sin RNC',
      },
      {
        name: 'CRÉDITO FISCAL',
        type: 'B',
        serie: '01',
        sequence: 0,
        sequenceLength: 8,
        increase: 1,
        quantity: 2000,
        description:
          'Comprobante para empresas con RNC que necesitan crédito fiscal',
      },
      {
        name: 'GUBERNAMENTAL',
        type: 'B',
        serie: '15',
        sequence: 0,
        sequenceLength: 8,
        increase: 1,
        quantity: 1000,
        description: 'Factura para entidades gubernamentales',
      },
      {
        name: 'NOTAS DE CRÉDITO',
        type: 'B',
        serie: '04',
        sequence: 0,
        sequenceLength: 8,
        increase: 1,
        quantity: 1000,
        description:
          'Nota de crédito para anular operaciones, devoluciones o descuentos.',
      },
    ],
  },
};

/**
 * Obtiene la lista de países disponibles
 * @returns {Array} Array de objetos con código y nombre del país
 */
export const getAvailableCountries = () => {
  return Object.entries(countryComprobantes).map(([code, data]) => ({
    code,
    name: data.countryName,
  }));
};

/**
 * Obtiene las plantillas de comprobantes para un país específico
 * @param {string} countryCode - Código ISO del país (ej. "DO" para República Dominicana)
 * @returns {Array} Array de plantillas de comprobantes
 */
export const getTemplatesForCountry = (countryCode) => {
  if (!countryComprobantes[countryCode]) {
    return [];
  }
  return countryComprobantes[countryCode].templates;
};
