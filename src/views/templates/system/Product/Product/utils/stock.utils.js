// stock.utils.js
export const isStockRestricted = (p) => p?.restrictSaleWithoutStock;
export const isStockExceeded = (inCart, p) => {
    if (!inCart || !p) return false;
    const total = p?.amountToBuy ?? 0;
    return total >= (p?.stock ?? 0);
};

export const isStockZero = (p) => p?.stock <= 0;

// Dynamic low-stock check using provided threshold (defaults to 20)
export const isStockLow = (p, lowThreshold = 20) => {
    if (!p) return false;
    const remaining = (p.stock ?? 0) - (p.amountToBuy ?? 0);
    return remaining > 0 && remaining <= (Number.isFinite(lowThreshold) ? lowThreshold : 20);
};
