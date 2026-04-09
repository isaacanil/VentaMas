// src/utils/invoiceValidation.js

type InvoiceCartProductLike = {
  amountToBuy?: unknown;
  batchId?: unknown;
  name?: unknown;
  productName?: unknown;
  productStockId?: unknown;
  pricing?: {
    price?: unknown;
  };
  restrictSaleWithoutStock?: unknown;
};

type InvoiceCartLike = {
  products?: InvoiceCartProductLike[] | null;
};

const getCartProducts = (cart?: InvoiceCartLike | null): InvoiceCartProductLike[] =>
  Array.isArray(cart?.products) ? cart.products : [];

export function hasProductsInInvoice(cart?: InvoiceCartLike | null) {
  return getCartProducts(cart).length > 0;
}

export function allProductsHaveValidQuantityInInvoice(cart?: InvoiceCartLike | null) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    const amount = Number(product.amountToBuy ?? 1);
    return Number.isFinite(amount) && amount > 0;
  });
}

export function meetsMinimumInvoiceRequirement(
  cart?: InvoiceCartLike | null,
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

export function validateInvoiceCart(
  cart?: InvoiceCartLike | null,
  _minimumRequiredAmount?: number,
) {
  if (!cart) {
    return {
      isValid: false,
      message: 'Cart data is missing.',
    };
  }
  if (!('products' in cart)) {
    return {
      isValid: false,
      message: 'Cart products array is missing.',
    };
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

  const productRequiringPhysicalSelection = cart.products.find((product) => {
    if (!product || typeof product !== 'object') return false;
    if (product.restrictSaleWithoutStock !== true) return false;
    return !product.productStockId || !product.batchId;
  });

  if (productRequiringPhysicalSelection) {
    const productName =
      typeof productRequiringPhysicalSelection.name === 'string' &&
      productRequiringPhysicalSelection.name.trim().length > 0
        ? productRequiringPhysicalSelection.name.trim()
        : typeof productRequiringPhysicalSelection.productName === 'string' &&
            productRequiringPhysicalSelection.productName.trim().length > 0
          ? productRequiringPhysicalSelection.productName.trim()
          : 'este producto';

    return {
      isValid: false,
      message: `Debes seleccionar la ubicación o existencia física de "${productName}" antes de facturar.`,
    };
  }

  return {
    isValid: true,
    message: 'Cart validation passed.',
  };
}
