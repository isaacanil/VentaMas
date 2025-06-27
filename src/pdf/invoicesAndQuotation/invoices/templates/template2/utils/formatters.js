import { DateTime } from 'luxon';

export function money(n) {
  const num = Number(n) || 0;
  const parts = num.toFixed(2).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `RD$ ${parts.join('.')}`;
}

export function formatDate(ts) {
  const ms =
    ts instanceof Date
      ? ts.getTime()
      : typeof ts.toMillis === 'function'
      ? ts.toMillis()
      : ts?.seconds
      ? ts.seconds * 1000
      : Number(ts);

  if (isNaN(ms)) return '';
  return DateTime.fromMillis(ms).toFormat('dd/MM/yyyy');
}

export function getDiscount(d) {
  const subtotal = d.products.reduce(
    (sum, p) => sum + p.pricing.price * p.amountToBuy,
    0
  );
  return subtotal * (d.discount.value / 100);
}

export function getProductIndividualDiscount(product) {
  if (!product.discount || product.discount.value <= 0) return 0;
  
  const price = +product.pricing?.price || 0;
  const quantity = +product.amountToBuy || 1;
  const subtotalBeforeDiscount = price * quantity;
  
  if (product.discount.type === 'percentage') {
    return subtotalBeforeDiscount * (product.discount.value / 100);
  } else {
    // Para monto fijo
    return Math.min(product.discount.value, subtotalBeforeDiscount);
  }
}

export function getProductsIndividualDiscounts(products) {
  return products.reduce((total, product) => {
    return total + getProductIndividualDiscount(product);
  }, 0);
}

export function hasIndividualDiscounts(products) {
  return products.some(product => 
    product.discount && product.discount.value > 0
  );
}
