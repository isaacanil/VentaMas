import {
  createSlice,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { CreditNoteSelection } from '@/types/creditNote';

import { GenericClient } from '@/features/clientCart/clientCartSlice';
import { roundDecimals } from '@/utils/pricing';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import {
  getCartProductCurrencies,
  type MonetaryRateConfig,
} from '@/utils/accounting/lineMonetary';
import { normalizeAccountingCurrencyRateConfig } from '@/utils/accounting/contracts';

import { initialState, defaultDelivery } from './default/default';
import { resolveProductForCartDocumentCurrency } from './utils/documentPricing';
import { updateAllTotals } from './utils/updateAllTotals';
import type {
  CartData,
  CartAccountingContext,
  CartSettings,
  CartState,
  Client,
  DiscountContext,
  MonetaryRateOverride,
  PaymentMethod,
  Product,
  SupportedDocumentCurrency,
} from './types';

type CartSnapshot = Partial<CartData>;
type PaymentValue = number | string;
type CartRootState = { cart: CartState; taxReceipt?: { enabled?: boolean } };

interface UpdateProductFieldsPayload {
  id: string;
  data: Partial<Product>;
}

interface ChangeProductPricePayload {
  id: string;
  pricing?: Product['pricing'];
  saleUnit?: Product['selectedSaleUnit'];
  price?: number;
}

interface ChangeProductWeightPayload {
  id: string;
  weight: number;
}

export interface FiscalTaxationPayload {
  enabled: boolean;
  source?: 'legacy-tax-receipt' | 'business-fiscal';
}

const normalizeDocumentCurrency = (
  value: unknown,
): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(value, DEFAULT_FUNCTIONAL_CURRENCY);

const normalizeExchangeRate = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeRateOverride = (
  value: MonetaryRateOverride | null | undefined,
): MonetaryRateOverride | null => {
  if (!value?.applied) return null;

  return {
    applied: true,
    value: normalizeExchangeRate(value.value),
    reason:
      typeof value.reason === 'string' && value.reason.trim().length
        ? value.reason.trim()
        : null,
  };
};

const normalizeManualRatesByCurrency = (
  value: CartAccountingContext['manualRatesByCurrency'] | undefined,
): Partial<Record<SupportedDocumentCurrency, MonetaryRateConfig>> =>
  Object.entries(value ?? {}).reduce<
    Partial<Record<SupportedDocumentCurrency, MonetaryRateConfig>>
  >((accumulator, [currency, rates]) => {
    const normalizedCurrency = normalizeDocumentCurrency(currency);
    const normalizedRates = normalizeAccountingCurrencyRateConfig(rates);
    accumulator[normalizedCurrency] = {
      buyRate: normalizeExchangeRate(normalizedRates.buyRate),
      sellRate: normalizeExchangeRate(normalizedRates.sellRate),
    };
    return accumulator;
  }, {});

const normalizeAccountingContext = (
  value: CartAccountingContext | null | undefined,
): CartAccountingContext => ({
  functionalCurrency: normalizeDocumentCurrency(value?.functionalCurrency),
  manualRatesByCurrency: normalizeManualRatesByCurrency(
    value?.manualRatesByCurrency,
  ),
});

interface ChangeProductAmountPayload {
  id: string;
  value?: PaymentValue;
}

type BillingSettingsPayload = CartSettings['billing'];

const matchesCartProductIdentifier = (
  product: Partial<Product> | null | undefined,
  identifier: string,
): boolean => {
  if (!product || !identifier) return false;
  return product.cid === identifier || product.id === identifier;
};

const hasPhysicalStockIdentity = (
  product: Partial<Product> | null | undefined,
): boolean =>
  Boolean(
    product &&
      !product.weightDetail?.isSoldByWeight &&
      (product.productStockId || product.batchId || product.restrictSaleWithoutStock),
  );

const canMergeCartProductLine = (
  existing: Partial<Product> | null | undefined,
  incoming: Partial<Product> | null | undefined,
): boolean => {
  if (!existing || !incoming) return false;
  if (existing.id !== incoming.id) return false;
  if (existing.weightDetail?.isSoldByWeight || incoming.weightDetail?.isSoldByWeight) {
    return false;
  }

  if (hasPhysicalStockIdentity(existing) || hasPhysicalStockIdentity(incoming)) {
    return (
      String(existing.productStockId ?? '') === String(incoming.productStockId ?? '') &&
      String(existing.batchId ?? '') === String(incoming.batchId ?? '')
    );
  }

  return true;
};

const resolveCartLineCid = (product: Product): string => {
  if (product.weightDetail?.isSoldByWeight) {
    return nanoid(8);
  }

  if (product.productStockId || product.batchId) {
    return `${product.id ?? 'product'}::${product.productStockId ?? 'no-stock'}::${product.batchId ?? 'no-batch'}`;
  }

  return String(product.cid ?? product.id ?? nanoid(8));
};

const ensureCartLineCid = (product: Product): string => {
  const currentCid =
    typeof product.cid === 'string' && product.cid.trim().length > 0
      ? product.cid
      : null;

  if (product.weightDetail?.isSoldByWeight) {
    return currentCid ?? nanoid(8);
  }

  if (product.productStockId || product.batchId) {
    return resolveCartLineCid(product);
  }

  return currentCid ?? String(product.id ?? nanoid(8));
};

const normalizeCartProductLine = (product: Product): Product => ({
  ...product,
  cid: ensureCartLineCid(product),
});

export const cartSlice = createSlice({
  name: 'factura',
  initialState,
  reducers: {
    toggleCart: (state: CartState) => {
      const isOpen = state.isOpen;
      state.isOpen = !isOpen;
    },
    loadCart: (state: CartState, actions: PayloadAction<CartSnapshot>) => {
      const cart = actions.payload;
      if (cart?.id) {
        // Convert Firestore Timestamps to milliseconds for serialization
        const processedCart = { ...cart };

        // Convert preorderDetails.date if it exists
        if (processedCart.preorderDetails?.date) {
          const date = processedCart.preorderDetails.date;
          // Check if it's a Firestore Timestamp (has seconds and nanoseconds)
          if (typeof date === 'object' && date !== null && 'seconds' in date) {
            processedCart.preorderDetails = {
              ...processedCart.preorderDetails,
              date: (date as { seconds: number }).seconds * 1000, // Convert to milliseconds
            };
          }
        }

        // Convert history array dates if they exist
        if (processedCart.history && Array.isArray(processedCart.history)) {
          processedCart.history = processedCart.history.map((historyItem) => {
            if (historyItem?.date) {
              const date = historyItem.date;
              // Check if it's a Firestore Timestamp
              if (
                typeof date === 'object' &&
                date !== null &&
                'seconds' in date
              ) {
                return {
                  ...historyItem,
                  date: (date as { seconds: number }).seconds * 1000, // Convert to milliseconds
                };
              }
            }
            return historyItem;
          });
        }

        processedCart.documentCurrency = normalizeDocumentCurrency(
          processedCart.documentCurrency,
        );
        processedCart.functionalCurrency = normalizeDocumentCurrency(
          processedCart.functionalCurrency ?? processedCart.documentCurrency,
        );
        processedCart.manualRatesByCurrency = normalizeManualRatesByCurrency(
          processedCart.manualRatesByCurrency,
        );
        processedCart.mixedCurrencySale = processedCart.mixedCurrencySale === true;
        processedCart.exchangeRate =
          normalizeExchangeRate(processedCart.exchangeRate) ?? 1;
        processedCart.rateOverride = normalizeRateOverride(
          processedCart.rateOverride as MonetaryRateOverride | null,
        );
        if (Array.isArray(processedCart.products)) {
          processedCart.products = processedCart.products.map((product) =>
            normalizeCartProductLine(product as Product),
          );
        }

        state.data = processedCart as CartData;
      }
    },
    setClient: (
      state: CartState,
      actions: PayloadAction<Client | null | undefined>,
    ) => {
      const client = actions.payload;
      if (client?.id) {
        state.data.client = client;
      }
      if (client?.delivery?.status === true) {
        state.data.delivery = client?.delivery;
      } else {
        state.data.delivery = defaultDelivery;
      }
    },
    setDefaultClient: (state: CartState) => {
      state.data.client = GenericClient;
      state.data.delivery = defaultDelivery;
      state.data.isAddedToReceivables = false;
    },
    setPaymentAmount: (
      state: CartState,
      actions: PayloadAction<PaymentValue>,
    ) => {
      const paymentValue = actions.payload;
      const isPreOrderEnabled = state.settings.isPreOrderEnabled;

      if (
        isPreOrderEnabled &&
        state.data.status === 'preorder' &&
        !state.data.isPreOrder
      ) {
        throw new Error(
          'Debe marcar la factura como preorden antes de proceder al pago.',
        );
      }

      const paymentMethod = state.data.paymentMethod.find(
        (item) => item.status === true,
      );
      if (paymentMethod) {
        state.data.payment.value = Number(paymentValue);
        paymentMethod.value = Number(paymentValue);
      }
    },
    changePaymentValue: (
      state: CartState,
      actions: PayloadAction<PaymentValue>,
    ) => {
      const paymentValue = actions.payload;
      state.data.payment.value = Number(paymentValue);
    },
    updateProductFields: (
      state: CartState,
      action: PayloadAction<UpdateProductFieldsPayload>,
    ) => {
      const { id, data } = action.payload;
      const product = state.data.products.find(
        (p) => p.id === id || p.cid === id,
      );
      if (product) {
        Object.assign(product, data);
      }
    },
    addTaxReceiptInState: (
      state: CartState,
      actions: PayloadAction<string | null>,
    ) => {
      state.data.NCF = actions.payload;
    },
    setTaxReceiptEnabled: (
      state: CartState,
      actions: PayloadAction<boolean>,
    ) => {
      const taxReceiptEnabled = actions.payload;
      state.settings.taxReceipt.enabled = taxReceiptEnabled;
    },
    setFiscalTaxationSettings: (
      state: CartState,
      action: PayloadAction<FiscalTaxationPayload>,
    ) => {
      state.settings.fiscal.taxationEnabled = Boolean(action.payload.enabled);
      state.settings.fiscal.taxationSource =
        action.payload.source || 'legacy-tax-receipt';
    },
    toggleInvoicePanelOpen: (state: CartState) => {
      state.settings.isInvoicePanelOpen = !state.settings.isInvoicePanelOpen;
    },
    setCartId: (state: CartState) => {
      if (!state.data.id) {
        const fallbackId = state.data.cartId || state.data.cartIdRef || null;
        state.data.id = fallbackId || nanoid();
      }
    },
    addPaymentMethod: (
      state: CartState,
      actions: PayloadAction<PaymentMethod[]>,
    ) => {
      const data = actions.payload;
      state.data.paymentMethod = data;
    },
    setPaymentMethod: (
      state: CartState,
      actions: PayloadAction<PaymentMethod>,
    ) => {
      try {
        const paymentMethod = actions.payload;
        if (paymentMethod.value !== undefined) {
          paymentMethod.value = Math.max(0, Number(paymentMethod.value) || 0);
        }

        const index = state.data.paymentMethod.findIndex(
          (method) => method.method === paymentMethod.method,
        );

        if (index !== -1) {
          state.data.paymentMethod[index] = paymentMethod;
        }
      } catch (error) {
        console.error('Error in setPaymentMethod:', error);
      }
    },
    setAccountingContext: (
      state: CartState,
      action: PayloadAction<CartAccountingContext | null | undefined>,
    ) => {
      const normalized = normalizeAccountingContext(action.payload);
      state.data.functionalCurrency = normalized.functionalCurrency;
      state.data.manualRatesByCurrency = normalized.manualRatesByCurrency;

      if (state.data.mixedCurrencySale) {
        state.data.documentCurrency = normalized.functionalCurrency;
      }
    },
    setDocumentCurrency: (
      state: CartState,
      action: PayloadAction<SupportedDocumentCurrency | null | undefined>,
    ) => {
      const functionalCurrency = normalizeDocumentCurrency(
        state.data.functionalCurrency ?? state.data.documentCurrency,
      );
      const documentCurrency = state.data.mixedCurrencySale
        ? functionalCurrency
        : normalizeDocumentCurrency(action.payload);
      state.data.documentCurrency = documentCurrency;
      state.data.exchangeRate =
        normalizeExchangeRate(state.data.exchangeRate) ?? 1;
      state.data.rateOverride = normalizeRateOverride(state.data.rateOverride);
    },
    setDocumentExchangeRate: (
      state: CartState,
      action: PayloadAction<number | string | null | undefined>,
    ) => {
      state.data.exchangeRate = normalizeExchangeRate(action.payload) ?? 1;
    },
    setDocumentRateOverride: (
      state: CartState,
      action: PayloadAction<MonetaryRateOverride | null | undefined>,
    ) => {
      state.data.rateOverride = normalizeRateOverride(action.payload);
    },
    toggleReceivableStatus: (
      state: CartState,
      actions: PayloadAction<boolean | undefined>,
    ) => {
      const value = actions.payload;
      if (value === undefined) {
        state.data.isAddedToReceivables = !state.data.isAddedToReceivables;
      } else {
        state.data.isAddedToReceivables = value;
      }
    },

    changeProductPrice: (
      state: CartState,
      action: PayloadAction<ChangeProductPricePayload>,
    ) => {
      const { id, pricing, saleUnit, price } = action.payload;
      const product = state.data.products.find((product) =>
        matchesCartProductIdentifier(product, id),
      );
      if (product) {
        if (saleUnit) {
          product.selectedSaleUnit = saleUnit;
        } else if (pricing) {
          product.pricing = pricing;
          product.pricing.price = product.pricing.listPrice;
          product.selectedSaleUnit = null;
        }
        if (price && product.selectedSaleUnit) {
          product.selectedSaleUnit.pricing.price = price;
        } else if (price) {
          product.pricing.price = price;
        }
      }
    },
    changePaymentMethod: (state: CartState) => {
      const paymentMethod = state.data.paymentMethod;
      const paymentMethodSelected = paymentMethod.findIndex(
        (method) => method.status === true,
      );
      if (paymentMethodSelected) {
        paymentMethodSelected;
      }
    },
    addPaymentMethodAutoValue: (state: CartState) => {
      const totalPurchase = state.data.totalPurchase.value;
      state.data.payment.value = totalPurchase;
    },
    addProduct: (state: CartState, action: PayloadAction<Product>) => {
      const functionalCurrency = normalizeDocumentCurrency(
        state.data.functionalCurrency ?? state.data.documentCurrency,
      );
      const resolution = resolveProductForCartDocumentCurrency(
        action.payload,
        normalizeDocumentCurrency(state.data.documentCurrency),
        {
          hasCartProducts: state.data.products.length > 0,
          functionalCurrency,
          manualRatesByCurrency: normalizeManualRatesByCurrency(
            state.data.manualRatesByCurrency,
          ),
          currentCartCurrencies: getCartProductCurrencies(
            state.data.products,
            functionalCurrency,
          ),
        },
      );
      const product = resolution.product;
      if (!resolution.eligible || !product) {
        return;
      }
      state.data.functionalCurrency = functionalCurrency;
      state.data.documentCurrency = resolution.documentCurrency;
      state.data.mixedCurrencySale = resolution.mixedCurrencySale;
      const products = state.data.products;
      const incomingAmount =
        (product.amountToBuy ?? 0) > 0 ? product.amountToBuy : 1;
      const matchingLine = products.find((existingProduct) =>
        canMergeCartProductLine(existingProduct, product),
      );

      if (matchingLine) {
        matchingLine.productStockId = product.productStockId;
        matchingLine.batchId = product.batchId;
        matchingLine.stock = product.stock;
        if (product.batchInfo) {
          matchingLine.batchInfo = product.batchInfo;
        }
        matchingLine.amountToBuy += incomingAmount;
      } else {
        const productData = {
          ...product,
          cid: ensureCartLineCid(product),
          amountToBuy: incomingAmount,
          insurance: product.insurance || { mode: null, value: 0 },
        };
        state.data.products = [...products, productData];
      }
    },
    deleteProduct: (state: CartState, action: PayloadAction<string>) => {
      const productFound = state.data.products.find(
        (product) => matchesCartProductIdentifier(product, action.payload),
      );
      if (productFound) {
        state.data.products.splice(
          state.data.products.indexOf(productFound),
          1,
        );
      }
      if (state.data.products.length === 0) {
        state.data.id = null;
        state.data.products = [];
      }
    },
    onChangeValueAmountToProduct: (
      state: CartState,
      action: PayloadAction<ChangeProductAmountPayload>,
    ) => {
      const { id, value } = action.payload;
      const productFound = state.data.products.find(
        (product) => matchesCartProductIdentifier(product, id),
      );
      if (productFound) {
        productFound.amountToBuy = Number(value);
      }
    },
    addAmountToProduct: (
      state: CartState,
      action: PayloadAction<Pick<ChangeProductAmountPayload, 'id'>>,
    ) => {
      const { id } = action.payload;
      const productFound = state.data.products.find(
        (product) => matchesCartProductIdentifier(product, id),
      );
      if (productFound) {
        productFound.amountToBuy = productFound.amountToBuy + 1;
      }
    },
    diminishAmountToProduct: (
      state: CartState,
      action: PayloadAction<Pick<ChangeProductAmountPayload, 'id'>>,
    ) => {
      const { id } = action.payload;
      const productFound = state.data.products.find(
        (product: Product) => matchesCartProductIdentifier(product, id),
      );
      if (productFound) {
        productFound.amountToBuy -= 1;
        if (productFound.amountToBuy === 0) {
          state.data.products.splice(
            state.data.products.indexOf(productFound),
            1,
          );
        }
      }
    },
    setCashPaymentToTotal: (state: CartState) => {
      const total = state.data.totalPurchase.value;
      // Ajustar array de métodos de pago
      state.data.paymentMethod = state.data.paymentMethod.map((m) => ({
        ...m,
        value: m.method === 'cash' ? total : 0,
        status: m.method === 'cash',
      }));
      // También actualizar payment.value y change
      state.data.payment.value = total;
      state.data.change.value = 0;
    },
    resetCart: (state: CartState) => {
      return {
        ...initialState,
        settings: {
          ...initialState.settings,
          ...state.settings,
          billing: { ...state.settings.billing },
        },
      } as CartState;
    },
    changeProductWeight: (
      state: CartState,
      action: PayloadAction<ChangeProductWeightPayload>,
    ) => {
      const { id, weight } = action.payload;
      const product = state.data.products.find((product) => product.cid === id);
      if (product && product.weightDetail) {
        product.weightDetail.weight = weight;
      }
    },
    totalPurchaseWithoutTaxes: (state: CartState) => {
      const ProductsSelected = state.data.products;
      const result = ProductsSelected.reduce(
        (total, product) => total + product.cost.total,
        0,
      );
      state.data.totalPurchaseWithoutTaxes.value = roundDecimals(result);
    },
    addDiscount: (state: CartState, action: PayloadAction<PaymentValue>) => {
      const value = action.payload;
      state.data.discount.value = Number(value);
    },
    setDiscountAuthorizationContext: (
      state: CartState,
      action: PayloadAction<DiscountContext | null>,
    ) => {
      if (!state.data.authorizationContext) {
        state.data.authorizationContext = {};
      }
      state.data.authorizationContext.discount = action.payload || null;
    },
    clearDiscountAuthorizationContext: (state: CartState) => {
      if (state.data.authorizationContext) {
        state.data.authorizationContext.discount = null;
      }
    },
    addSourceOfPurchase: (state: CartState, actions: PayloadAction<string>) => {
      const source = actions.payload;
      state.data.sourceOfPurchase = source;
    },
    togglePrintInvoice: (state: CartState) => {
      state.settings.printInvoice = !state.settings.printInvoice;
    },
    toggleInvoicePanel: (state: CartState) => {
      state.settings.isInvoicePanelOpen = !state.settings.isInvoicePanelOpen;
    },
    setBillingSettings: (
      state: CartState,
      action: PayloadAction<BillingSettingsPayload>,
    ) => {
      const { billingMode, isError, isLoading } = action.payload;
      state.settings.billing.billingMode = billingMode;
      state.settings.billing = {
        ...state.settings.billing,
        ...action.payload,
      };
      state.settings.billing.isLoading = isLoading;
      state.settings.billing.isError = isError;
    },
    updateProductInsurance: (
      state: CartState,
      action: PayloadAction<{ id: string; mode: string | null; value: number }>,
    ) => {
      const { id, mode, value } = action.payload;
      const product = state.data.products.find(
        (p) => p.id === id || p.cid === id,
      );
      if (product) {
        product.insurance = { mode, value };
      }
    },
    updateInsuranceStatus: (
      state: CartState,
      action: PayloadAction<boolean>,
    ) => {
      state.data.insuranceEnabled = action.payload;

      if (!action.payload) {
        state.data.products.forEach((product) => {
          if (product.insurance) {
            product.insurance = { mode: null, value: 0 };
          }
        });
      }
    },
    applyPricingPreset: (
      state: CartState,
      action: PayloadAction<{ priceKey?: string }>,
    ) => {
      const { priceKey } = action.payload || {};
      if (!priceKey) return;

      const applyPrice = (
        pricing:
          | Product['pricing']
          | { price: number; [key: string]: any }
          | undefined,
      ) => {
        if (!pricing) return false;
        const candidate = Number(pricing[priceKey as keyof typeof pricing]);
        if (Number.isFinite(candidate) && candidate > 0) {
          pricing.price = candidate;
          return true;
        }
        return false;
      };

      state.data.products.forEach((product) => {
        if (!product) return;
        const { pricing, selectedSaleUnit } = product;
        applyPrice(pricing);
        if (selectedSaleUnit?.pricing) {
          applyPrice(selectedSaleUnit.pricing);
        }
      });

      updateAllTotals(state);
    },
    recalcTotals: (
      state: CartState,
      action: PayloadAction<number | null | undefined>,
    ) => {
      const paymentValue =
        action.payload !== undefined && action.payload !== null
          ? Number(action.payload)
          : undefined;
      updateAllTotals(state, paymentValue);

      // Auto-remove from CxC if payment covers total purchase
      if (state.data.isAddedToReceivables) {
        const totalPurchase = state.data.totalPurchase?.value || 0;
        const totalPayment = state.data.payment?.value || 0;

        // If payment is greater than or equal to total purchase, remove from CxC
        if (totalPayment >= totalPurchase && totalPurchase > 0) {
          state.data.isAddedToReceivables = false;
          // Set a flag to show notification after this reducer completes
          state.showCxcAutoRemovalNotification = true;
        }
      }
    },
    addInvoiceComment: (state: CartState, action: PayloadAction<string>) => {
      state.data.invoiceComment = action.payload;
    },
    deleteInvoiceComment: (state: CartState) => {
      state.data.invoiceComment = '';
    },
    clearCxcAutoRemovalNotification: (state: CartState) => {
      state.showCxcAutoRemovalNotification = false;
    },
    updateProductDiscount: (
      state: CartState,
      action: PayloadAction<{ id: string; discount: Product['discount'] }>,
    ) => {
      const { id, discount } = action.payload;
      const product = state.data.products.find(
        (p) => p.id === id || p.cid === id,
      );
      if (product) {
        product.discount = discount;
        updateAllTotals(state);
      }
    },
    setCreditNotePayment: (
      state: CartState,
      action: PayloadAction<CreditNoteSelection[] | null | undefined>,
    ) => {
      const creditNoteSelections = action.payload || [];

      // Calcular el total de notas de crédito aplicadas
      const totalCreditNoteAmount = creditNoteSelections.reduce(
        (sum, selection) => sum + (selection.amountToUse || 0),
        0,
      );

      // Calcular cuánto se ha pagado con otros métodos
      const totalOtherPayments = state.data.paymentMethod
        .filter((method) => method.status && method.method !== 'creditNote')
        .reduce((sum, method) => sum + (Number(method.value) || 0), 0);

      // Validar que el total no exceda el monto de la compra
      const totalPurchase = state.data.totalPurchase?.value || 0;
      const remainingToPay = Math.max(0, totalPurchase - totalOtherPayments);
      const validCreditNoteAmount = Math.min(
        totalCreditNoteAmount,
        remainingToPay,
      );

      // Si el monto de notas de crédito es válido, aplicarlo
      if (validCreditNoteAmount >= 0) {
        state.data.creditNotePayment = creditNoteSelections
          .filter((selection) => selection.amountToUse > 0)
          .map((selection) => ({
            id: selection.id != null ? String(selection.id) : '',
            ncf:
              selection.creditNote?.ncf || selection.creditNote?.number || '',
            amountUsed: selection.amountToUse,
            originalAmount: selection.creditNote?.totalAmount || 0,
            appliedDate: new Date().toISOString(),
          }));
      }

      // Actualizar el método de pago de notas de crédito
      const creditNoteMethodIndex = state.data.paymentMethod.findIndex(
        (method) => method.method === 'creditNote',
      );

      if (creditNoteMethodIndex !== -1) {
        state.data.paymentMethod[creditNoteMethodIndex] = {
          ...state.data.paymentMethod[creditNoteMethodIndex],
          value: validCreditNoteAmount,
          status: validCreditNoteAmount > 0,
        };
      } else if (validCreditNoteAmount > 0) {
        // Si no existe el método de pago de notas de crédito, agregarlo
        state.data.paymentMethod.push({
          method: 'creditNote',
          name: 'Notas de Crédito',
          value: validCreditNoteAmount,
          status: true,
        });
      }
    },
    clearCreditNotePayment: (state: CartState) => {
      state.data.creditNotePayment = [];

      // Desactivar el método de pago de notas de crédito
      const creditNoteMethodIndex = state.data.paymentMethod.findIndex(
        (method) => method.method === 'creditNote',
      );

      if (creditNoteMethodIndex !== -1) {
        state.data.paymentMethod[creditNoteMethodIndex] = {
          ...state.data.paymentMethod[creditNoteMethodIndex],
          value: 0,
          status: false,
        };
      }
    },
  },
});

export const {
  addAmountToProduct,
  setCartId,
  setClient,
  setPaymentAmount,
  addPaymentMethod,
  addDiscount,
  setDiscountAuthorizationContext,
  clearDiscountAuthorizationContext,
  addPaymentMethodAutoValue,
  addProduct,
  addSourceOfPurchase,
  addTaxReceiptInState,
  resetCart,
  changePaymentValue,
  changeProductPrice,
  changeProductWeight,
  setCashPaymentToTotal,
  deleteProduct,
  setAccountingContext,
  setDocumentCurrency,
  setDocumentExchangeRate,
  setDocumentRateOverride,
  setPaymentMethod,
  toggleReceivableStatus,
  diminishAmountToProduct,
  onChangeValueAmountToProduct,
  loadCart,
  toggleInvoicePanelOpen,
  totalPurchaseWithoutTaxes,
  setTaxReceiptEnabled,
  setFiscalTaxationSettings,
  updateProductFields,
  toggleCart,
  togglePrintInvoice,
  toggleInvoicePanel,
  setDefaultClient,
  setBillingSettings,
  updateProductInsurance,
  applyPricingPreset,
  recalcTotals,
  updateInsuranceStatus,
  addInvoiceComment,
  deleteInvoiceComment,
  updateProductDiscount,
  clearCxcAutoRemovalNotification,
  setCreditNotePayment,
  clearCreditNotePayment,
} = cartSlice.actions;

export const SelectProduct = (state: CartRootState) => state.cart.data.products;
export const SelectFacturaData = (state: CartRootState) => state.cart.data;
export const SelectClient = (state: CartRootState) => state.cart.data.client;
export const SelectDelivery = (state: CartRootState) =>
  state.cart.data.delivery;
export const SelectTotalPurchaseWithoutTaxes = (state: CartRootState) =>
  state.cart.data.totalPurchaseWithoutTaxes.value;
export const SelectTotalTaxes = (state: CartRootState) =>
  state.cart.data.totalTaxes.value;
export const SelectTotalPurchase = (state: CartRootState) =>
  state.cart.data.totalPurchase.value;
export const SelectTotalShoppingItems = (state: CartRootState) =>
  state.cart.data.totalShoppingItems.value;
export const SelectChange = (state: CartRootState) =>
  state.cart.data.change.value;
export const SelectSourceOfPurchase = (state: CartRootState) =>
  state.cart.data.sourceOfPurchase;
export const SelectPaymentValue = (state: CartRootState) =>
  state.cart.data.payment.value;
export const SelectDiscount = (state: CartRootState) =>
  state.cart.data.discount.value;
export const SelectNCF = (state: CartRootState) => state.cart.data.NCF;
export const SelectCartPermission = (state: CartRootState) =>
  state.cart.permission;
export const SelectCartIsOpen = (state: CartRootState) => state.cart.isOpen;
export const SelectCartData = (state: CartRootState) => state.cart.data;
export const selectCartDocumentCurrency = (state: CartRootState) =>
  normalizeDocumentCurrency(state.cart.data.documentCurrency);
export const selectCartType = (state: CartRootState) => state.cart.data.type;
export const selectCartPreorderNumber = (state: CartRootState) =>
  state.cart.data.preorderDetails?.numberID;
const selectCartProductLookupByProductId = createSelector(
  [(state: CartRootState) => state.cart.data.products],
  (products = []) => {
    const lookup = new Map<string | number, Product>();

    products.forEach((product) => {
      const productId = product?.id;
      if (
        (typeof productId === 'string' || typeof productId === 'number') &&
        !lookup.has(productId)
      ) {
        lookup.set(productId, product);
      }
    });

    return lookup;
  },
);

export const selectCartProductByProductId = (
  state: CartRootState,
  productId?: string | number | null,
) => {
  if (typeof productId !== 'string' && typeof productId !== 'number') {
    return null;
  }

  return selectCartProductLookupByProductId(state).get(productId) ?? null;
};
export const SelectInvoiceComment = (state: CartRootState) =>
  state.cart.data.invoiceComment;
export const SelectSettingCart = (state: CartRootState) => state.cart.settings;
export const selectCartTaxationEnabled = (state: CartRootState) =>
  state.cart.settings.fiscal.taxationEnabled;
export const selectCartTaxationSource = (state: CartRootState) =>
  state.cart.settings.fiscal.taxationSource;
export const SelectCxcAutoRemovalNotification = (state: CartRootState) =>
  state.cart.showCxcAutoRemovalNotification;
export const selectCart = (state: CartRootState) => state.cart;
export const selectInsuranceEnabled = (state: CartRootState) =>
  state.cart.data.insuranceEnabled;
export const selectProductsWithIndividualDiscounts = createSelector(
  [(state: CartRootState) => state.cart.data.products],
  (products = []) =>
    products.filter(
      (
        product,
      ): product is Product & { discount: NonNullable<Product['discount']> } =>
        Boolean(product.discount && product.discount.value > 0),
    ),
);

export const selectTotalIndividualDiscounts = createSelector(
  [
    selectProductsWithIndividualDiscounts,
    (state: CartRootState) =>
      state.cart.settings.fiscal?.taxationEnabled ??
      state.taxReceipt?.enabled ??
      true,
  ],
  (discountedProducts, taxationEnabled) =>
    discountedProducts.reduce((total, product) => {
      const rawPrice = product.pricing?.price || product.price || 0;
      const productPrice =
        typeof rawPrice === 'number' ? rawPrice : Number(rawPrice?.unit || 0);

      const taxPercentage = product.pricing?.tax
        ? Number(product.pricing.tax)
        : 0;
      const quantity = product.amountToBuy || 1;

      const unitPriceWithTax = taxationEnabled
        ? productPrice * (1 + taxPercentage / 100)
        : productPrice;
      const totalPriceWithTax = unitPriceWithTax * quantity;

      if (product.discount?.type === 'percentage') {
        return total + totalPriceWithTax * (product.discount.value / 100);
      }

      return total + (product.discount?.value || 0);
    }, 0),
);

export const selectCreditNotePayment = (state: CartRootState) =>
  state.cart.data.creditNotePayment;
export const selectTotalCreditNotePayment = (state: CartRootState) =>
  state.cart.data.creditNotePayment.reduce(
    (sum, selection) => sum + (selection.amountUsed || 0),
    0,
  );

export default cartSlice.reducer;



