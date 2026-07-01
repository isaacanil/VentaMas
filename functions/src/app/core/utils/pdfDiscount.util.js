const isFiniteNumberLike = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return Number.isFinite(Number(value));
};

export function getActiveProductPricing(product) {
  return product?.selectedSaleUnit?.pricing || product?.pricing || null;
}

export function getActiveUnitPrice(product) {
  const activePricing = getActiveProductPricing(product);
  if (isFiniteNumberLike(activePricing?.price)) {
    return Number(activePricing.price);
  }

  const legacyPrice =
    product?.price && typeof product.price === 'object'
      ? product.price.unit ?? product.price.total
      : product?.price;

  return isFiniteNumberLike(legacyPrice) ? Number(legacyPrice) : 0;
}

export function getDiscount(data) {
  const products = Array.isArray(data?.products) ? data.products : [];
  const discountValue = Number(data?.discount?.value) || 0;

  if (!discountValue || products.length === 0) return 0;

  const subtotal = products.reduce((sum, product) => {
    const price = getActiveUnitPrice(product);
    const qty = Number(product?.amountToBuy) || 0;
    return sum + price * qty;
  }, 0);

  return subtotal * (discountValue / 100);
}
