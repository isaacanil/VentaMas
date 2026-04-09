import {
  getProductsInsuranceExtra,
  getTotalDiscount,
  getTotalItems,
  roundDecimals,
} from '@/utils/pricing';
import {
  getCartProductCurrencies,
  getFunctionalProductDiscount,
  getFunctionalProductSubtotal,
  getFunctionalProductTax,
  getFunctionalProductTotal,
} from '@/utils/accounting/lineMonetary';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import { normalizeInvoiceChange } from '@/utils/invoice';
import type { CartState, Product } from '../types';

export const updateAllTotals = (state: CartState, paymentValue?: number) => {
  try {
    if (
      !state ||
      !state.data ||
      !state.settings ||
      !state.settings.taxReceipt
    ) {
      console.warn('updateAllTotals: Invalid state structure');
      return;
    }

    const {
      settings: {
        taxReceipt: { enabled: taxReceiptEnabled },
      },
      data: {
        products = [],
        discount = { value: 0 },
        delivery = { value: 0 },
        paymentMethod = [],
        totalPurchase,
        totalInsurance,
        totalTaxes,
        totalShoppingItems,
        totalPurchaseWithoutTaxes,
        payment,
        change,
      },
    } = state;

    const functionalCurrency = normalizeSupportedDocumentCurrency(
      state.data.functionalCurrency,
      DEFAULT_FUNCTIONAL_CURRENCY,
    );
    const productCurrencies = getCartProductCurrencies(products, functionalCurrency);
    const isMixedCurrencySale = productCurrencies.length > 1;

    state.data.functionalCurrency = functionalCurrency;
    state.data.mixedCurrencySale = isMixedCurrencySale;
    if (isMixedCurrencySale) {
      state.data.documentCurrency = functionalCurrency;
    }

    const discountValue = Number(discount.value) || 0;
    const deliveryValue = Number(delivery.value) || 0;
    const insurance = getProductsInsuranceExtra(products as Product[]);
    const subtotal = products.reduce(
      (total, product) => total + getFunctionalProductSubtotal(product),
      0,
    );
    const promotionDiscount = products.reduce(
      (total, product) => total + getFunctionalProductDiscount(product),
      0,
    );
    const taxes = products.reduce(
      (total, product) => total + getFunctionalProductTax(product, taxReceiptEnabled),
      0,
    );
    const productsTotal = products.reduce(
      (total, product) => total + getFunctionalProductTotal(product, taxReceiptEnabled),
      0,
    );
    const totalBeforeGeneralDiscount = subtotal - promotionDiscount;
    const generalDiscount = getTotalDiscount(
      totalBeforeGeneralDiscount,
      discountValue,
    );
    const purchaseValue = productsTotal - generalDiscount + deliveryValue - insurance;

    const totalPaymentFromMethods = paymentMethod.reduce((total, method) => {
      if (!method) return total;
      return method.status ? total + (Number(method.value) || 0) : total;
    }, 0);

    const pay =
      paymentValue !== undefined ? Number(paymentValue) : totalPaymentFromMethods;

    if (totalPurchase) totalPurchase.value = purchaseValue;
    if (totalInsurance) Object.assign(totalInsurance, { value: insurance });
    if (totalTaxes) totalTaxes.value = taxes;
    if (totalShoppingItems)
      totalShoppingItems.value = getTotalItems(products as Product[]);
    if (totalPurchaseWithoutTaxes) {
      totalPurchaseWithoutTaxes.value = subtotal;
    }

    if (payment) payment.value = roundDecimals(pay, 2);
    if (change) change.value = normalizeInvoiceChange(pay - purchaseValue);
  } catch (error) {
    console.error('Error in updateAllTotals:', error);
  }
};
