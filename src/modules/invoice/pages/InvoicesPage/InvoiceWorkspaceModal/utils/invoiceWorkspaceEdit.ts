import type {
  DiscountType,
  InvoiceClient,
  InvoiceData,
  InvoicePaymentMethod,
  InvoiceProduct,
  InvoiceProductAmount,
} from '@/types/invoice';
import {
  applyDiscount,
  calculateChange,
} from '@/features/invoice/utils/invoiceTotals';
import {
  getProductsPrice,
  getProductsTax,
  getProductsTotalPrice,
  getTotalItems,
} from '@/utils/pricing';
import {
  convertInvoiceDateToMillis,
  prepareInvoiceForEdit,
} from '@/utils/invoice';
import {
  resolveElectronicTaxReceiptSnapshot,
  resolveFiscalDocumentNumber,
} from '@/utils/invoice/electronicTaxReceipt';

const DIRECT_EDIT_LIMIT_MS = 48 * 60 * 60 * 1000;
const LOCKED_INVOICE_STATUSES = new Set([
  'issued',
  'posted',
  'committed',
  'completed',
  'partial',
  'paid',
  'voided',
  'canceled',
  'cancelled',
  'reversed',
]);

export type InvoiceWorkspaceEditState = {
  canEditDirectly: boolean;
  reasons: string[];
};

export type InvoiceWorkspaceEditWindow = {
  expiresAtMs: number | null;
  isOpen: boolean;
  label: string;
  remainingMs: number;
};

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatEditWindowRemaining = (remainingMs: number): string => {
  if (remainingMs <= 0) return '0m';

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${minutes}m`;
};

const clonePaymentMethods = (
  methods?: InvoicePaymentMethod[] | null,
): InvoicePaymentMethod[] =>
  Array.isArray(methods) ? methods.map((method) => ({ ...method })) : [];

const cloneProducts = (products?: InvoiceProduct[] | null): InvoiceProduct[] =>
  Array.isArray(products)
    ? products.map((product) => ({
        ...product,
        pricing: product.pricing ? { ...product.pricing } : product.pricing,
        selectedSaleUnit: product.selectedSaleUnit
          ? {
              ...product.selectedSaleUnit,
              pricing: product.selectedSaleUnit.pricing
                ? { ...product.selectedSaleUnit.pricing }
                : product.selectedSaleUnit.pricing,
            }
          : product.selectedSaleUnit,
      }))
    : [];

export const getWorkspaceEditProductQuantity = (
  product?: InvoiceProduct | null,
): number => {
  if (!product) return 1;
  const amountToBuy = product.amountToBuy;

  if (typeof amountToBuy === 'number') {
    return amountToBuy > 0 ? amountToBuy : 1;
  }

  if (amountToBuy && typeof amountToBuy === 'object') {
    const total = toFiniteNumber((amountToBuy as InvoiceProductAmount).total);
    const unit = toFiniteNumber((amountToBuy as InvoiceProductAmount).unit);

    if (total > 0) return total;
    if (unit > 0) return unit;
  }

  return 1;
};

export const getWorkspaceEditProductKey = (
  product: InvoiceProduct,
  index = 0,
): string =>
  product.id ||
  product.productId ||
  product.cid ||
  product.sku ||
  product.barcode ||
  `product-${index}`;

const normalizeProductAmount = (
  product: InvoiceProduct,
  amount: number,
): InvoiceProduct => ({
  ...product,
  amountToBuy: Math.max(1, toFiniteNumber(amount, 1)),
});

const normalizePaymentMethods = (
  methods: InvoicePaymentMethod[] = [],
): InvoicePaymentMethod[] =>
  methods.map((method) => ({
    ...method,
    status: Boolean(method.status),
    value: roundToTwoDecimals(Math.max(0, toFiniteNumber(method.value))),
  }));

const resolvePaymentTotal = (invoice: InvoiceData): number => {
  const paymentMethods = normalizePaymentMethods(invoice.paymentMethod || []);
  if (paymentMethods.length > 0) {
    return roundToTwoDecimals(
      paymentMethods.reduce(
        (sum, method) =>
          sum + (method.status ? toFiniteNumber(method.value) : 0),
        0,
      ),
    );
  }

  return roundToTwoDecimals(toFiniteNumber(invoice.payment?.value));
};

export const recalculateWorkspaceInvoiceDraft = (
  invoice: InvoiceData,
): InvoiceData => {
  const products = cloneProducts(invoice.products);
  const paymentMethod = normalizePaymentMethods(invoice.paymentMethod || []);
  const totalBeforeDiscount = roundToTwoDecimals(
    getProductsTotalPrice(products),
  );
  const discountType: DiscountType =
    invoice.discount?.type === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = toFiniteNumber(invoice.discount?.value);
  const totalPurchase = discountValue
    ? applyDiscount(totalBeforeDiscount, discountValue, discountType)
    : totalBeforeDiscount;
  const totalPayment = resolvePaymentTotal({ ...invoice, paymentMethod });

  return {
    ...invoice,
    products,
    paymentMethod,
    discount: {
      ...invoice.discount,
      type: discountType,
      value: discountValue,
    },
    totalPurchase: {
      ...invoice.totalPurchase,
      value: totalPurchase,
    },
    totalTaxes: {
      ...invoice.totalTaxes,
      value: roundToTwoDecimals(getProductsTax(products)),
    },
    totalPurchaseWithoutTaxes: {
      ...invoice.totalPurchaseWithoutTaxes,
      value: roundToTwoDecimals(getProductsPrice(products)),
    },
    totalShoppingItems: {
      ...invoice.totalShoppingItems,
      value: getTotalItems(products),
    },
    payment: {
      ...invoice.payment,
      value: totalPayment,
    },
    change: {
      ...invoice.change,
      value: calculateChange(totalPurchase, totalPayment),
    },
  };
};

export const createWorkspaceInvoiceDraft = (
  invoice: InvoiceData,
): InvoiceData => {
  const preparedInvoice = prepareInvoiceForEdit(invoice) ?? invoice;

  return recalculateWorkspaceInvoiceDraft({
    ...preparedInvoice,
    client: preparedInvoice.client ? { ...preparedInvoice.client } : {},
    products: cloneProducts(preparedInvoice.products),
    paymentMethod: clonePaymentMethods(preparedInvoice.paymentMethod),
  });
};

export const updateWorkspaceDraftClient = (
  invoice: InvoiceData,
  client: InvoiceClient,
): InvoiceData =>
  recalculateWorkspaceInvoiceDraft({
    ...invoice,
    client: { ...client },
  });

export const updateWorkspaceDraftDiscount = (
  invoice: InvoiceData,
  value: number,
  type: DiscountType = invoice.discount?.type === 'fixed'
    ? 'fixed'
    : 'percentage',
): InvoiceData =>
  recalculateWorkspaceInvoiceDraft({
    ...invoice,
    discount: {
      ...invoice.discount,
      type,
      value,
    },
  });

export const updateWorkspaceDraftProductQuantity = (
  invoice: InvoiceData,
  productKey: string,
  quantity: number,
): InvoiceData => {
  const products = cloneProducts(invoice.products).map((current, index) =>
    getWorkspaceEditProductKey(current, index) === productKey
      ? normalizeProductAmount(current, quantity)
      : current,
  );

  return recalculateWorkspaceInvoiceDraft({ ...invoice, products });
};

export const updateWorkspaceDraftProductUnitPrice = (
  invoice: InvoiceData,
  productKey: string,
  unitPrice: number,
): InvoiceData => {
  const nextUnitPrice = roundToTwoDecimals(
    Math.max(0, toFiniteNumber(unitPrice)),
  );
  const products = cloneProducts(invoice.products).map((current, index) => {
    if (getWorkspaceEditProductKey(current, index) !== productKey) {
      return current;
    }

    const quantity = getWorkspaceEditProductQuantity(current);
    const nextPrice = {
      ...current.price,
      unit: nextUnitPrice,
      total: roundToTwoDecimals(nextUnitPrice * quantity),
    };
    const nextPricing = {
      ...current.pricing,
      price: nextUnitPrice,
    };
    const nextSelectedSaleUnit = current.selectedSaleUnit
      ? {
          ...current.selectedSaleUnit,
          pricing: {
            ...(current.selectedSaleUnit.pricing || nextPricing),
            price: nextUnitPrice,
          },
        }
      : current.selectedSaleUnit;

    return {
      ...current,
      price: nextPrice,
      pricing: nextPricing,
      selectedSaleUnit: nextSelectedSaleUnit,
    };
  });

  return recalculateWorkspaceInvoiceDraft({ ...invoice, products });
};

export const addWorkspaceDraftProduct = (
  invoice: InvoiceData,
  product: InvoiceProduct,
  quantity = 1,
): InvoiceData => {
  if (!product) return invoice;

  const productToAdd = normalizeProductAmount(product, quantity);
  const productKey = getWorkspaceEditProductKey(productToAdd);
  const products = cloneProducts(invoice.products);
  const existingIndex = products.findIndex(
    (current, index) =>
      getWorkspaceEditProductKey(current, index) === productKey,
  );

  if (existingIndex >= 0) {
    const current = products[existingIndex];
    products[existingIndex] = normalizeProductAmount(
      current,
      getWorkspaceEditProductQuantity(current) + quantity,
    );
  } else {
    products.push(productToAdd);
  }

  return recalculateWorkspaceInvoiceDraft({ ...invoice, products });
};

export const removeWorkspaceDraftProduct = (
  invoice: InvoiceData,
  productKey: string,
): InvoiceData => {
  const products = cloneProducts(invoice.products).filter(
    (current, index) =>
      getWorkspaceEditProductKey(current, index) !== productKey,
  );

  return recalculateWorkspaceInvoiceDraft({ ...invoice, products });
};

export const updateWorkspaceDraftPaymentMethods = (
  invoice: InvoiceData,
  paymentMethod: InvoicePaymentMethod[],
): InvoiceData =>
  recalculateWorkspaceInvoiceDraft({
    ...invoice,
    paymentMethod: clonePaymentMethods(paymentMethod),
  });

export const resolveInvoiceWorkspaceEditState = (
  invoice?: InvoiceData | null,
  now = Date.now(),
): InvoiceWorkspaceEditState => {
  if (!invoice) {
    return {
      canEditDirectly: false,
      reasons: ['No hay factura activa.'],
    };
  }

  const reasons: string[] = [];
  const status =
    typeof invoice.status === 'string' ? invoice.status.toLowerCase() : '';

  if (status !== 'draft') {
    reasons.push(
      'La edición directa solo está habilitada para facturas draft.',
    );
  }

  if (LOCKED_INVOICE_STATUSES.has(status)) {
    reasons.push(`La factura ya está en estado ${invoice.status}.`);
  }

  if (
    resolveFiscalDocumentNumber(invoice) ||
    resolveElectronicTaxReceiptSnapshot(invoice)
  ) {
    reasons.push('La factura ya tiene huella fiscal NCF/e-CF.');
  }

  if (invoice.numberID) {
    reasons.push('La factura ya tiene número definitivo.');
  }

  if (
    Array.isArray(invoice.paymentHistory) &&
    invoice.paymentHistory.length > 0
  ) {
    reasons.push('La factura ya tiene historial de pagos.');
  }

  if (toFiniteNumber(invoice.accumulatedPaid) > 0) {
    reasons.push('La factura ya tiene pagos acumulados.');
  }

  if (toFiniteNumber(invoice.balanceDue) > 0) {
    reasons.push('La factura ya tiene balance por cobrar.');
  }

  const timestampMs = convertInvoiceDateToMillis(invoice.date);
  if (!timestampMs || now - timestampMs >= DIRECT_EDIT_LIMIT_MS) {
    reasons.push('La ventana operativa de 48 horas expiró.');
  }

  return {
    canEditDirectly: reasons.length === 0,
    reasons,
  };
};

export const resolveInvoiceWorkspaceEditWindow = (
  invoice?: InvoiceData | null,
  now = Date.now(),
): InvoiceWorkspaceEditWindow => {
  const timestampMs = convertInvoiceDateToMillis(invoice?.date);

  if (!timestampMs) {
    return {
      expiresAtMs: null,
      isOpen: false,
      label: 'Sin fecha',
      remainingMs: 0,
    };
  }

  const expiresAtMs = timestampMs + DIRECT_EDIT_LIMIT_MS;
  const remainingMs = Math.max(0, expiresAtMs - now);

  return {
    expiresAtMs,
    isOpen: remainingMs > 0,
    label: formatEditWindowRemaining(remainingMs),
    remainingMs,
  };
};
