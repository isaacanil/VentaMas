import { Timestamp } from 'firebase/firestore';

export const sanitizeData = <T extends Record<string, any>>(
  data: T,
  defaultsMap: Record<string, unknown> = {},
): T => {
  // Función auxiliar para procesar cada propiedad recursivamente
  const processField = (field: any, key?: string): any => {
    if (field === undefined || field === null) {
      // Si el campo está en defaultsMap, usar el valor predeterminado
      return key && key in defaultsMap ? defaultsMap[key] : null;
    }
    if (typeof field === 'string' && field.trim() === '') return '';
    if (typeof field === 'number' && Number.isNaN(field)) return 0;
    if (field instanceof Date) return Timestamp.fromDate(field);
    if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
      return sanitizeObject(field as Record<string, any>);
    }
    if (Array.isArray(field)) {
      return field.map((item) => processField(item));
    }
    return field;
  };

  // Función auxiliar para procesar objetos
  const sanitizeObject = (obj: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      sanitized[key] = processField(obj[key], key);
    }
    return sanitized;
  };

  return sanitizeObject(data) as T;
};

export const defaultsMap: Record<string, unknown> = {
  // Campos dentro de `dates`
  createdAt: null,
  deletedAt: null,
  completedAt: null,
  deliveryAt: null,
  paymentAt: null,
  // Compatibilidad con esquema legacy
  deliveryDate: null,
  paymentDate: null,

  // Campos dentro de `replenishments`
  expirationDate: null,
  quantity: 0,
  orderedQuantity: 0,
  receivedQuantity: 0,
  pendingQuantity: 0,
  unitMeasurement: 'unknown',
  baseCost: 0,
  taxPercentage: 0,
  freight: 0,
  otherCosts: 0,
  unitCost: 0,
  subTotal: 0,
  calculatedITBIS: 0,
};
