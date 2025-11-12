// src/utils/taxReceiptUtils.js

/**
 * Genera un nuevo comprobante con una serie única
 * @param {Array} localReceipts Array de comprobantes locales
 * @returns {Object} Nuevo comprobante
 */
export function generateNewTaxReceipt(localReceipts) {
  // Considerar todas las series existentes, incluso las deshabilitadas
  const existingSeries = new Set(localReceipts.map((r) => r.data.serie));
  let counter = 3; // arrancamos en 03
  let newSerie = counter < 10 ? `0${counter}` : `${counter}`;
  while (existingSeries.has(newSerie)) {
    counter++;
    newSerie = counter < 10 ? `0${counter}` : `${counter}`;
  }

  return {
    data: {
      name: 'NUEVO COMPROBANTE',
      type: 'B',
      serie: newSerie,
      sequence: '0000000000',
      increase: 1,
      quantity: 2000,
      disabled: false, // Aseguramos que los nuevos comprobantes estén activos
    },
  };
}

/**
 * Filtra comprobantes predefinidos para extraer los únicos
 * y devuelve duplicados para avisar al usuario.
 * @param {Array} newReceipts Comprobantes candidatos a añadir
 * @param {Array} localReceipts Comprobantes ya existentes
 */
export function filterPredefinedReceipts(newReceipts, localReceipts) {
  // Considerar todas las series y nombres existentes, incluso las de comprobantes deshabilitados
  const existingSeries = new Set(localReceipts.map((r) => r.data.serie));
  const existingNames = new Set(localReceipts.map((r) => r.data.name));

  const unique = [];
  const duplicateNames = [];
  const duplicateSeries = [];

  newReceipts.forEach((r) => {
    const { name, serie } = r.data;
    if (existingNames.has(name)) {
      duplicateNames.push(name);
    } else if (existingSeries.has(serie)) {
      duplicateSeries.push(serie);
    } else {
      // Asegurar que los nuevos comprobantes tengan el estado disabled=false
      const receiptWithDisabledState = {
        ...r,
        data: {
          ...r.data,
          disabled: false,
        },
      };
      unique.push(receiptWithDisabledState);
      existingNames.add(name);
      existingSeries.add(serie);
    }
  });

  return { unique, duplicateNames, duplicateSeries };
}
