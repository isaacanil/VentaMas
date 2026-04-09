export type PizzaSliceMode = 'complete' | 'half';

export interface PizzaProductSelected {
  a: string;
  b: string;
}

interface ProductLike {
  pricing?: {
    price?: number;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const safeParseProduct = (value: string): ProductLike => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isRecord(parsed)) {
      return parsed as ProductLike;
    }
  } catch {
    return {};
  }
  return {};
};

interface GetPriceParams {
  productSelected: PizzaProductSelected;
  isComplete: PizzaSliceMode;
}

export const getPrice = ({
  productSelected,
  isComplete,
}: GetPriceParams): number | '' => {
  const a = productSelected.a ? safeParseProduct(productSelected.a) : {};
  const b = productSelected.b ? safeParseProduct(productSelected.b) : {};

  const firstProductPrice =
    typeof a?.pricing?.price === 'number' ? a.pricing.price : null;
  const secondProductPrice =
    typeof b?.pricing?.price === 'number' ? b.pricing.price : null;

  const resolvedPrice =
    isComplete === 'complete'
      ? firstProductPrice ?? ''
      : firstProductPrice != null && secondProductPrice != null
        ? Math.max(firstProductPrice, secondProductPrice)
        : firstProductPrice ?? secondProductPrice ?? '';

  return resolvedPrice;
};
