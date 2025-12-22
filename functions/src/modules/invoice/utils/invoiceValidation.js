// functions/src/modules/invoice/utils/invoiceValidation.js

/**
 * Checks if the invoice cart contains at least one product.
 * @param {Object} cart - Cart data object. Expects a "products" property which should be an array.
 * @returns {boolean} True if the cart has products.
 */
function hasProductsInInvoice(cart) {
  return cart.products && cart.products.length > 0;
}

/**
 * Checks if all products in the invoice cart have a valid quantity (greater than zero).
 * @param {Object} cart - Cart data object. Each product should have an "amountToBuy" property.
 * @returns {boolean} True if all products have a valid quantity.
 */
function allProductsHaveValidQuantityInInvoice(cart) {
  return cart.products.every((product) => product.amountToBuy > 0);
}

/**
 * Combines all invoice cart validations.
 * @param {Object} cart - Cart data object.
 * @returns {Object} An object containing the validation status and a message.
 */
export function validateInvoiceCart(cart) {
  if (!cart) {
    return { isValid: false, message: 'Cart data is missing.' };
  }
  if (!cart.products) {
    return { isValid: false, message: 'Cart products array is missing.' };
  }
  if (!hasProductsInInvoice(cart)) {
    return {
      isValid: false,
      message: 'The invoice cart is empty. Please add products.',
    };
  }
  if (!allProductsHaveValidQuantityInInvoice(cart)) {
    return {
      isValid: false,
      message: 'One or more products have an invalid quantity (must be > 0).',
    };
  }
  // Additional validations (e.g., minimum amount requirement) can be added here if needed.
  return { isValid: true, message: 'Cart validation passed.' };
}
