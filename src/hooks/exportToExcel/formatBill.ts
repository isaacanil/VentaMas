// @ts-nocheck
import { formatTimestamp } from '@/utils/format';

const unwrapInvoice = (raw) => raw?.data ?? raw?.ver?.data ?? raw ?? {};

const ensureNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const translatePaymentMethod = (method) => {
  if (!method || method === 'N/A') return 'N/A';

  const translations = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    credit: 'Crédito',
    debit: 'Débito',
    credito: 'Crédito',
    debito: 'Débito',
  };

  // Convertir a minúsculas para buscar
  const methodLower = method.toLowerCase().trim();

  // Buscar traducción exacta
  if (translations[methodLower]) {
    return translations[methodLower];
  }

  // Si no encuentra traducción, capitalizar la primera letra
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
};

const getPrimaryPaymentMethod = (paymentMethod = []) => {
  const method = (paymentMethod.find((pm) => pm.status) || {}).method ?? 'N/A';
  return translatePaymentMethod(method);
};

const getPrimaryPaymentValue = (paymentMethod = [], fallbackPayment) => {
  if (fallbackPayment?.value != null)
    return ensureNumber(fallbackPayment.value);
  const pm = paymentMethod.find((pm) => pm.status);
  return pm ? ensureNumber(pm.value) : 0;
};
const formatBillResumen = (data) => {
  const {
    date,
    id: _id,
    NCF,
    client = {},
    totalShoppingItems = {},
    totalTaxes = {},
    paymentMethod,
    payment,
    change = {},
    delivery = {},
    totalPurchase = {},
  } = data;
  return {
    ['Fecha']: formatTimestamp(date),
    ['Comprobante']: NCF ?? 'N/A',
    ['Nombre Cliente']: client.name || 'Cliente Genérico',
    ['Teléfono Cliente']: client.tel || 'N/A',
    ['Dirección Cliente']: client.address || 'N/A',
    ['RNC/Cédula']: client.personalID || 'N/A',
    ['Cantidad de Productos']: ensureNumber(totalShoppingItems.value),
    ['Total ITBIS']: ensureNumber(totalTaxes.value),
    ['Método de Pago']: getPrimaryPaymentMethod(paymentMethod),
    ['Pagado']: getPrimaryPaymentValue(paymentMethod, payment),
    ['Delivery']: ensureNumber(delivery.value),
    ['Cambio']: ensureNumber(change.value),
    ['Total']: ensureNumber(totalPurchase.value),
  };
};
const formatBillDetailed = (facturas) => {
  const resultados = [];

  facturas.forEach((raw) => {
    const factura = unwrapInvoice(raw);
    const {
      products = [],
      client = {},
      NCF,
      date,
      id: _id,
      totalPurchase = {},
    } = factura;

    products.forEach((product) => {
      resultados.push({
        Fecha: formatTimestamp(date),
        Comprobante: NCF,
        Cliente: client.name || 'Cliente Genérico',
        Producto: product.name,
        Categoría: product.category,
        Tipo: product.type,
        Precio: ensureNumber(product.pricing?.price),
        'Cantidad Facturada': ensureNumber(product.amountToBuy),
        Total: ensureNumber(totalPurchase.value),
      });
    });
  });

  return resultados;
};

export const formatBill = ({ type, data }) => {
  switch (type) {
    case 'Resumen':
      return formatBillResumen(data);
    case 'Detailed':
      return formatBillDetailed(data);
    default:
      return [];
  }
};
