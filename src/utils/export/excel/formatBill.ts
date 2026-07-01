import { formatTimestamp } from '@/utils/format';
import { getActiveUnitPrice } from '@/utils/pricing';
import type {
  InvoiceData,
  InvoiceMonetaryValue,
  InvoicePaymentMethod,
  InvoiceProduct,
} from '@/types/invoice';

type InvoiceWrapper = {
  data?: InvoiceData;
  ver?: { data?: InvoiceData };
};

type InvoiceLike = InvoiceData | InvoiceWrapper;

type PaymentMethodLike = InvoicePaymentMethod[] | null | undefined;

type PaymentValueLike = InvoiceMonetaryValue | null | undefined;

const unwrapInvoice = (raw: InvoiceLike): InvoiceData =>
  (raw as InvoiceWrapper)?.data ??
  (raw as InvoiceWrapper)?.ver?.data ??
  (raw as InvoiceData) ??
  {};

const ensureNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const roundQuantity = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

const ensurePositiveNumber = (value: unknown, fallback = 0): number => {
  const num = ensureNumber(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const readAmountQuantity = (amount: InvoiceProduct['amountToBuy']): number => {
  if (amount && typeof amount === 'object' && !Array.isArray(amount)) {
    return ensurePositiveNumber(
      amount.total,
      ensurePositiveNumber(
        amount.unit,
        ensurePositiveNumber(
          amount.value,
          ensurePositiveNumber(amount.quantity, 0),
        ),
      ),
    );
  }

  return ensurePositiveNumber(amount, 0);
};

const getSelectedSaleUnit = (
  product: InvoiceProduct,
): Record<string, unknown> | null => {
  const selectedSaleUnit =
    product.selectedSaleUnit ??
    (product as InvoiceProduct & { saleUnit?: unknown }).saleUnit;

  return selectedSaleUnit &&
    typeof selectedSaleUnit === 'object' &&
    !Array.isArray(selectedSaleUnit)
    ? (selectedSaleUnit as Record<string, unknown>)
    : null;
};

const resolveSaleUnitConversionFactor = (
  saleUnit: Record<string, unknown> | null,
): number =>
  roundQuantity(
    ensurePositiveNumber(
      saleUnit?.conversionFactorToBase,
      ensurePositiveNumber(saleUnit?.quantity, 1),
    ),
  );

const resolveSaleUnitLabel = (
  saleUnit: Record<string, unknown> | null,
): string => {
  if (!saleUnit) return '';

  const name =
    typeof saleUnit.unitName === 'string' && saleUnit.unitName.trim()
      ? saleUnit.unitName.trim()
      : 'Unidad';
  const factor = resolveSaleUnitConversionFactor(saleUnit);
  return factor === 1 ? name : `${name} x ${factor}`;
};

const resolveWeightQuantity = (product: InvoiceProduct): number =>
  product.weightDetail?.isSoldByWeight === true
    ? roundQuantity(ensurePositiveNumber(product.weightDetail.weight, 0))
    : 0;

const resolveExportQuantities = (product: InvoiceProduct) => {
  const saleUnit = getSelectedSaleUnit(product);
  const amountQuantity = readAmountQuantity(product.amountToBuy);
  const weightQuantity = resolveWeightQuantity(product);
  const isSoldByWeight = product.weightDetail?.isSoldByWeight === true;
  const commercialQuantity = isSoldByWeight ? weightQuantity : amountQuantity;
  const explicitBaseQuantity = ensurePositiveNumber(product.baseQuantity, 0);
  const baseQuantity =
    explicitBaseQuantity > 0
      ? roundQuantity(explicitBaseQuantity)
      : roundQuantity(
          isSoldByWeight
            ? weightQuantity
            : amountQuantity * resolveSaleUnitConversionFactor(saleUnit),
        );

  return {
    baseQuantity,
    commercialQuantity,
    saleUnitLabel: resolveSaleUnitLabel(saleUnit),
    saleUnitQuantity: saleUnit ? amountQuantity : '',
    weightQuantity: isSoldByWeight ? weightQuantity : '',
    weightUnit: isSoldByWeight ? (product.weightDetail?.weightUnit ?? '') : '',
  };
};

const translatePaymentMethod = (method?: string | null): string => {
  if (!method || method === 'N/A') return 'N/A';

  const translations: Record<string, string> = {
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

const getPrimaryPaymentMethod = (
  paymentMethod: PaymentMethodLike = [],
): string => {
  const method = (paymentMethod.find((pm) => pm.status) || {}).method ?? 'N/A';
  return translatePaymentMethod(method);
};

const getPrimaryPaymentValue = (
  paymentMethod: PaymentMethodLike = [],
  fallbackPayment: PaymentValueLike,
): number => {
  if (fallbackPayment?.value != null)
    return ensureNumber(fallbackPayment.value);
  const pm = paymentMethod.find((pm) => pm.status);
  return pm ? ensureNumber(pm.value) : 0;
};
const formatBillResumen = (data: InvoiceData) => {
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
const formatBillDetailed = (facturas: InvoiceLike[]) => {
  const resultados: Record<string, unknown>[] = [];

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
      const quantities = resolveExportQuantities(product);

      resultados.push({
        Fecha: formatTimestamp(date),
        Comprobante: NCF,
        Cliente: client.name || 'Cliente Genérico',
        Producto: product.name,
        Categoría: product.category,
        Tipo: product.type,
        Precio: ensureNumber(getActiveUnitPrice(product)),
        'Cantidad Facturada': quantities.commercialQuantity,
        'Cantidad Comercial': quantities.commercialQuantity,
        'Cantidad Base Inventario': quantities.baseQuantity,
        'Peso Vendido': quantities.weightQuantity,
        'Unidad Peso': quantities.weightUnit,
        'Cantidad Presentación': quantities.saleUnitQuantity,
        Presentación: quantities.saleUnitLabel,
        Total: ensureNumber(totalPurchase.value),
      });
    });
  });

  return resultados;
};

export const formatBill = ({
  type,
  data,
}: {
  type: 'Resumen' | 'Detailed';
  data: InvoiceData | InvoiceLike[];
}) => {
  switch (type) {
    case 'Resumen':
      return formatBillResumen(data as InvoiceData);
    case 'Detailed':
      return formatBillDetailed(data as InvoiceLike[]);
    default:
      return [];
  }
};
