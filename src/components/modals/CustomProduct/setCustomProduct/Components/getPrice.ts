import type { Dispatch, SetStateAction } from 'react';

export type PizzaSliceMode = 'complete' | 'half';

export interface PizzaProductSelected {
  a: string;
  b: string;
}

export interface PizzaProductState {
  pricing: {
    price: number | '';
    cost?: number;
    tax?: number;
  };
  [key: string]: unknown;
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
  setProduct: Dispatch<SetStateAction<PizzaProductState>>;
  isComplete: PizzaSliceMode;
}

export const getPrice = ({
  productSelected,
  setProduct,
  isComplete,
}: GetPriceParams): number | '' => {
  const a = productSelected.a ? safeParseProduct(productSelected.a) : {};
  const b = productSelected.b ? safeParseProduct(productSelected.b) : {};

  const firstProductPrice = a?.pricing?.price || '';
  const secondProductPrice = b?.pricing?.price || '';

  const complete = isComplete === 'complete';
  const half = isComplete === 'half';

  switch (true) {
    case complete && firstProductPrice:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
    case half && firstProductPrice > secondProductPrice:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
    case half && firstProductPrice < secondProductPrice:
      setProduct({
        pricing: {
          price: secondProductPrice,
        },
      });
      return secondProductPrice;
    case half && firstProductPrice === secondProductPrice:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
    default:
      setProduct({
        pricing: {
          price: firstProductPrice,
        },
      });
      return firstProductPrice;
  }
};
