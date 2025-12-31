import { CREDIT_NOTE_STATUS_LABEL } from '@/constants/creditNoteStatus';
import { formatTimestamp } from '@/utils/format';
import { getTax, getTotalPrice } from '@/utils/pricing';


/**
 * Convierte un valor a número, retornando 0 si no es válido
 */
const ensureNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Calcula el ITBIS total de una nota de crédito sumando el impuesto de cada item
 */
const calculateTotalItbis = (items) => {
  return items.reduce((acc, item) => acc + getTax(item, true), 0);
};

const formatCreditNoteResumen = (creditNote) => {
  const {
    createdAt,
    ncf,
    NCF: NCFUpper,
    client = {},
    items = [],
    totalAmount = 0,
    status = 'Emitida',
    invoiceNcf,
    invoiceNCF,
  } = creditNote;

  const totalItbis = calculateTotalItbis(items);

  return {
    Fecha: formatTimestamp(createdAt || new Date()),
    NCF: ncf || NCFUpper || 'N/A',
    'NCF Factura': invoiceNcf || invoiceNCF || 'N/A',
    Cliente: client.name || 'Cliente Genérico',
    Teléfono: client.tel || 'N/A',
    'RNC/Cédula': client.rnc || client.personalID || 'N/A',
    'Cantidad Items': items.length || 0,
    'Total ITBIS': ensureNumber(totalItbis),
    'Monto Total': ensureNumber(totalAmount),
    Estado: CREDIT_NOTE_STATUS_LABEL[status] || status,
  };
};

const formatCreditNoteDetailed = (creditNotes) => {
  const resultados = [];

  creditNotes.forEach((creditNote) => {
    const {
      createdAt,
      ncf,
      NCF: NCFUpper,
      client = {},
      items = [],
      totalAmount = 0,
      status = 'Emitida',
      invoiceNcf,
      invoiceNCF,
    } = creditNote;

    const totalItbis = calculateTotalItbis(items);

    items.forEach((item) => {
      const itemTotal = getTotalPrice(item, true, true);
      const itemItbis = getTax(item, true);

      resultados.push({
        Fecha: formatTimestamp(createdAt || new Date()),
        NCF: ncf || NCFUpper || 'N/A',
        'NCF Factura': invoiceNcf || invoiceNCF || 'N/A',
        Cliente: client.name || 'Cliente Genérico',
        Producto: item.name || 'N/A',
        Categoría: item.category || 'N/A',
        Cantidad: ensureNumber(item.amountToBuy || 1),
        'Precio Unitario': ensureNumber(item.pricing?.price || item.price || 0),
        'ITBIS Item': ensureNumber(itemItbis),
        'Total Item': ensureNumber(itemTotal),
        'Total ITBIS NC': ensureNumber(totalItbis),
        'Total NC': ensureNumber(totalAmount),
        Estado: CREDIT_NOTE_STATUS_LABEL[status] || status,
      });
    });
  });

  return resultados;
};

/**
 * Formatea una o varias notas de crédito según el tipo especificado
 * @param {Object} options - Opciones de formateo
 * @param {'Resumen'|'Detailed'} options.type - Tipo de formato a aplicar
 * @param {Object|Object[]} options.data - Nota(s) de crédito a formatear
 * @returns {Object[]} Array con los datos formateados
 */
export const formatCreditNote = ({ type, data }) => {
  switch (type) {
    case 'Resumen':
      return Array.isArray(data)
        ? data.map((creditNote) => formatCreditNoteResumen(creditNote))
        : [formatCreditNoteResumen(data)];
    case 'Detailed':
      return Array.isArray(data)
        ? formatCreditNoteDetailed(data)
        : formatCreditNoteDetailed([data]);
    default:
      return [];
  }
};
