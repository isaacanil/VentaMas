export type ProductDisplayNameLike = {
  id?: unknown;
  name?: unknown;
  productName?: unknown;
} | null | undefined;

export const resolveProductDisplayName = (
  productLike: ProductDisplayNameLike,
  fallback: string,
): string => {
  const candidate =
    productLike?.name ?? productLike?.productName ?? productLike?.id;

  if (typeof candidate === 'string') {
    const normalized = candidate.trim();
    return normalized.length > 0 ? normalized : fallback;
  }

  if (typeof candidate === 'number') {
    return String(candidate);
  }

  return fallback;
};
