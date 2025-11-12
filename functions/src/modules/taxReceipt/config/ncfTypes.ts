// functions/src/modules/taxReceipt/config/ncfTypes.ts

/**
 * Mapeo de códigos cortos de Tipos de Comprobantes Fiscales (NCF)
 * a sus nombres descriptivos completos según DGII (República Dominicana).
 * Las claves (ej: 'B01') son las que probablemente uses en tu UI o datos de entrada.
 * Los valores (ej: 'COMPROBANTE DE CREDITO FISCAL') son los que usualmente
 * se almacenan en la configuración de la secuencia en Firestore (campo 'data.name').
 */
export const NCF_TYPES: { [key: string]: string } = {
  B01: 'COMPROBANTE DE CREDITO FISCAL',
  B02: 'COMPROBANTE CONSUMIDOR FINAL',
  // 'B03': 'COMPROBANTE NOTA DE DEBITO',
  // 'B04': 'COMPROBANTE NOTA DE CREDITO',
  // 'B11': 'COMPROBANTE DE COMPRAS',
  // 'B12': 'COMPROBANTE REGISTRO UNICO DE INGRESOS',
  // 'B14': 'COMPROBANTE REGIMEN ESPECIAL',
  B15: 'COMPROBANTE GUBERNAMENTAL',
  // 'B16': 'COMPROBANTE EXPORTACION',
  // 'B17': 'COMPROBANTE PAGOS AL EXTERIOR',
};

// Puedes exportar también un tipo si lo necesitas en otros lugares
export type NcfTypeCode = keyof typeof NCF_TYPES;
