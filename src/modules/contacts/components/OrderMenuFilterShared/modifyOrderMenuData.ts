import type { Dispatch, SetStateAction } from 'react';

import type { OrderMenuItem, OrderMenuOption } from './types';

export const modifyOrderMenuData = (
  array: OrderMenuItem[],
  setArray: Dispatch<SetStateAction<OrderMenuItem[]>>,
  index: number,
  property: keyof OrderMenuItem,
  subProperty?: keyof OrderMenuOption,
  subIndex?: number,
  newValue?: unknown,
) => {
  const arrayUpdated = [...array];
  const item = arrayUpdated[index];

  if (!item) return;

  if (subProperty && subIndex !== undefined) {
    const target = item[property];

    if (Array.isArray(target) && target[subIndex]) {
      const option = target[subIndex] as OrderMenuOption;
      option[subProperty] = newValue as OrderMenuOption[keyof OrderMenuOption];
    }
  } else if (subProperty) {
    const target = item[property];

    if (target && typeof target === 'object' && !Array.isArray(target)) {
      (target as Record<string, unknown>)[subProperty as string] = newValue;
    }
  } else {
    (item as Record<string, unknown>)[property as string] = newValue;
  }

  setArray(arrayUpdated);
};

