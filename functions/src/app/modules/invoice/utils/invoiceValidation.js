// functions/src/modules/invoice/utils/invoiceValidation.js

const getCartProducts = (cart) => (Array.isArray(cart?.products) ? cart.products : []);

export function hasProductsInInvoice(cart) {
  return getCartProducts(cart).length > 0;
}

export function allProductsHaveValidQuantityInInvoice(cart) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    const amount = Number(product.amountToBuy ?? 1);
    return Number.isFinite(amount) && amount > 0;
  });
}

export function meetsMinimumInvoiceRequirement(
  cart,
  minimumRequiredAmount = 0,
) {
  const products = getCartProducts(cart);
  const totalAmount = products.reduce((acc, product) => {
    const price = Number(product?.pricing?.price ?? 0);
    const amount = Number(product?.amountToBuy ?? 1);
    return acc + price * amount;
  }, 0);

  return totalAmount >= minimumRequiredAmount;
}

export function validateInvoiceCart(cart) {
  if (!cart) {
    return { isValid: false, message: 'Cart data is missing.' };
  }
  if (!Object.prototype.hasOwnProperty.call(cart, 'products')) {
    return { isValid: false, message: 'Cart products array is missing.' };
  }
  if (!Array.isArray(cart.products)) {
    return {
      isValid: false,
      message: 'Cart products must be an array.',
    };
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
  return { isValid: true, message: 'Cart validation passed.' };
}
