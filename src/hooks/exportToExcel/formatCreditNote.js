import useFormatTimestamp from "../useFormatTimeStamp";
import { CREDIT_NOTE_STATUS_LABEL } from '../../constants/creditNoteStatus';
import { getTax, getTotalPrice } from '../../utils/pricing';

const ensureNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const formatCreditNoteResumen = (creditNote) => {
  const {
    createdAt,
    number,
    numberID,
    ncf,
    NCF: NCFUpper,
    client = {},
    items = [],
    totalAmount = 0,
    status = 'Emitida',
    invoiceId,
    invoiceNcf,
    invoiceNCF,
  } = creditNote;

  // Formatear fecha
  const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
  
  // Calcular ITBIS correctamente usando las funciones de pricing
  const totalItbis = items.reduce((acc, item) => {
    return acc + getTax(item, true);
  }, 0);
  
  return {
    ['Fecha']: useFormatTimestamp(createdAt || new Date()),
    ['NCF']: ncf || NCFUpper || 'N/A',
    ['NCF Factura']: invoiceNcf || invoiceNCF || 'N/A',
    ['Cliente']: client.name || 'Cliente Genérico',
    ['Teléfono']: client.tel || 'N/A',
    ['RNC/Cédula']: client.rnc || client.personalID || 'N/A',
    ['Cantidad Items']: items.length || 0,
    ['Total ITBIS']: ensureNumber(totalItbis),
    ['Monto Total']: ensureNumber(totalAmount),
    ['Estado']: CREDIT_NOTE_STATUS_LABEL[status] || status,
  };
};

const formatCreditNoteDetailed = (creditNotes) => {
  const resultados = [];

  creditNotes.forEach((creditNote) => {
    const {
      createdAt,
      number,
      numberID,
      ncf,
      NCF: NCFUpper,
      client = {},
      items = [],
      totalAmount = 0,
      status = 'Emitida',
      invoiceId,
      invoiceNcf,
      invoiceNCF,
    } = creditNote;

    const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);

    items.forEach((item) => {
      const itemTotal = getTotalPrice(item, true, true);
      const itemItbis = getTax(item, true);
      
      // Calcular ITBIS total de la nota de crédito (se repite para cada item de la misma NC)
      const totalItbis = items.reduce((acc, currentItem) => {
        return acc + getTax(currentItem, true);
      }, 0);
      
      resultados.push({
        Fecha: useFormatTimestamp(createdAt || new Date()),
        'NCF': ncf || NCFUpper || 'N/A',
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

export const formatCreditNote = ({ type, data }) => {
  switch (type) {
    case "Resumen":
      return Array.isArray(data) 
        ? data.map(creditNote => formatCreditNoteResumen(creditNote))
        : formatCreditNoteResumen(data);
    case "Detailed":
      return Array.isArray(data) 
        ? formatCreditNoteDetailed(data)
        : formatCreditNoteDetailed([data]);
    default:
      return [];
  }
}; 