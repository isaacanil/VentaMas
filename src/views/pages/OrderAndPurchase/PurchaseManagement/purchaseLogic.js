import { Timestamp } from 'firebase/firestore';

export const sanitizeData = (data, defaultsMap = {}) => {
  // Función auxiliar para procesar cada propiedad recursivamente
  const processField = (field, key) => {
    if (field === undefined || field === null) {
      // Si el campo está en defaultsMap, usar el valor predeterminado
      return key in defaultsMap ? defaultsMap[key] : null;
    }
    if (typeof field === 'string' && field.trim() === '') return ''; // Mantener strings vacíos
    if (typeof field === 'number' && isNaN(field)) return 0; // Asegurar que números no válidos se conviertan en 0
    if (field instanceof Date) return Timestamp.fromDate(field); // Convertir fechas a Timestamp de Firebase
    if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
      return sanitizeObject(field); // Procesar objetos recursivamente
    }
    if (Array.isArray(field)) {
      return field.map((item) => processField(item)); // Procesar arreglos
    }
    return field; // Devolver valores válidos sin cambios
  };

  // Función auxiliar para procesar objetos
  const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = processField(obj[key], key);
    }
    return sanitized;
  };

  return sanitizeObject(data);
};

export const defaultsMap = {
  // Campos dentro de `dates`
  createdAt: null, // Puedes mantener este como null o asignarle una fecha por defecto
  deletedAt: null,
  completedAt: null,
  deliveryDate: null,
  paymentDate: null,

  // Campos dentro de `replenishments`
  expirationDate: null,
  quantity: 0,
  unitMeasurement: 'unknown',
  baseCost: 0,
  taxPercentage: 0,
  freight: 0,
  otherCosts: 0,
  unitCost: 0,
  subTotal: 0,
  calculatedITBIS: 0,
};
