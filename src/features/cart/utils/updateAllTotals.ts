import {
  getProductsInsuranceExtra,
  getProductsPrice,
  getProductsTax,
  getProductsTotalPrice,
  getTotalItems,
} from '@/utils/pricing';
import type { CartState, Product } from '../types';

export const updateAllTotals = (
  state: CartState,
  paymentValue?: number,
) => {
  try {
    // Verificamos que el estado tenga la estructura correcta para evitar errores
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

    const discountValue = Number(discount.value) || 0;
    const deliveryValue = Number(delivery.value) || 0;

    // Calcula los valores de precios
    const totalPrice = getProductsTotalPrice(
      products as Product[],
      discountValue,
      deliveryValue,
      taxReceiptEnabled,
    );
    const insurance = getProductsInsuranceExtra(products as Product[]);
    const purchaseValue = totalPrice - insurance;

    // Calcula el total de pagos de manera segura
    const totalPaymentFromMethods = paymentMethod.reduce((total, method) => {
      if (!method) return total;
      return method.status ? total + (Number(method.value) || 0) : total;
    }, 0);

    // Determina el valor de pago a utilizar
    const pay =
      paymentValue !== undefined
        ? Number(paymentValue)
        : totalPaymentFromMethods;

    // Actualiza los totales de forma segura
    if (totalPurchase) totalPurchase.value = purchaseValue;
    if (totalInsurance) Object.assign(totalInsurance, { value: insurance });
    if (totalTaxes)
      totalTaxes.value = getProductsTax(products as Product[], taxReceiptEnabled);
    if (totalShoppingItems) totalShoppingItems.value = getTotalItems(products as Product[]);
    if (totalPurchaseWithoutTaxes)
      totalPurchaseWithoutTaxes.value = getProductsPrice(products as Product[]);

    if (payment) payment.value = pay;
    if (change) change.value = pay - purchaseValue;
  } catch (error) {
    console.error('Error in updateAllTotals:', error);
  }
};
