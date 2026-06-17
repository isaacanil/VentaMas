export function getDiscount(data) {
  const products = Array.isArray(data?.products) ? data.products : [];
  const discountValue = Number(data?.discount?.value) || 0;

  if (!discountValue || products.length === 0) return 0;

  const subtotal = products.reduce((sum, product) => {
    const price = Number(product?.pricing?.price) || 0;
    const qty = Number(product?.amountToBuy) || 0;
    return sum + price * qty;
  }, 0);

  return subtotal * (discountValue / 100);
}
