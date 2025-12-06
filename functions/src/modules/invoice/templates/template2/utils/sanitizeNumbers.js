export function sanitizeNumbers(d) {
  // Totales
  d.totalPurchaseWithoutTaxes.value =
    Number(d.totalPurchaseWithoutTaxes?.value) || 0;
  d.totalTaxes.value = Number(d.totalTaxes?.value) || 0;
  d.totalPurchase.value = Number(d.totalPurchase?.value) || 0;

  // Descuento y delivery
  d.discount.value = Number(d.discount?.value) || 0;
  d.delivery.value = Number(d.delivery?.value) || 0;

  // Métodos de pago
  d.paymentMethod = (d.paymentMethod || []).map((m) => ({
    ...m,
    value: Number(m.value) || 0,
  }));

  // Productos
  d.products = (d.products || []).map((p) => ({
    ...p,
    amountToBuy: Number(p.amountToBuy) || 0,
    pricing: {
      price: Number(p.pricing?.price) || 0,
      tax: Number(p.pricing?.tax) || 0,
    },
  }));
}

export function assertNoNaN(obj, path = '') {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => assertNoNaN(v, `${path}[${i}]`));
  } else if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) =>
      assertNoNaN(v, path ? `${path}.${k}` : k),
    );
  } else if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      throw new Error(`❌ Valor no válido (${obj}) en "${path || '(raíz)'}"`);
    }
  }
  return true;
}
