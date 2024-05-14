// src/utils/invoiceValidation.js

/**
 * Checks if the invoice cart contains at least one product.
 * @param {Array} cart Array of products in the invoice cart.
 * @returns {Boolean} Returns true if the cart is not empty.
 */
export function hasProductsInInvoice(cart) {
    return cart.products.length > 0;
}

/**
 * Checks if all products in the invoice cart have a valid quantity for purchase.
 * @param {Array} cart Array of products in the invoice cart.
 * @returns {Boolean} Returns true if all products have a valid quantity.
 */
export function allProductsHaveValidQuantityInInvoice(cart) {
    return cart.products.every(product => product.amountToBuy > 0);
}

/**
 * Validates if the invoice's total meets a required minimum for processing.
 * @param {Array} cart Array of products in the invoice cart.
 * @param {Number} minimumRequiredAmount Minimum required amount for processing the invoice.
 * @returns {Boolean} Returns true if the total meets the required minimum.
 */
export function meetsMinimumInvoiceRequirement(cart, minimumRequiredAmount) {
    const totalAmount = cart.products.reduce((acc, product) => acc + (product.pricing.price * product.amountToBuy), 0);
    return totalAmount >= minimumRequiredAmount;
}

/**
 * Combines all invoice cart validations to determine if it is ready for the billing process.
 * @param {Array} cart Array of products in the invoice cart.
 * @param {Number} minimumRequiredAmount Minimum required amount for processing the invoice.
 * @returns {Object} Object containing the validation status and error messages if any.
 */
export function validateInvoiceCart(cart, minimumRequiredAmount) {
    if (!cart) {
        return { isValid: false, message: 'The invoice cart is empty. Please provide the cart' };
    }
    if (!hasProductsInInvoice(cart)) {
        return { isValid: false, message: 'The invoice cart is empty. Please add products before proceeding to checkout.' };
    }
    if (!allProductsHaveValidQuantityInInvoice(cart)) {
        return { isValid: false, message: 'Some products in the invoice cart have invalid quantities. Please ensure all products have quantities greater than zero.' };
    }
    // if (!meetsMinimumInvoiceRequirement(cart, minimumRequiredAmount)) {
    //     return { isValid: false, message: `The total of the invoice cart must be at least ${minimumRequiredAmount}. Please add more products or increase the quantities of existing ones.` };
    // }
    return { isValid: true, message: 'The invoice cart is ready for the billing process.' };
}
