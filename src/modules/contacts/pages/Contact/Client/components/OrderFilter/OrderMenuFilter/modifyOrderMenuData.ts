type ArraySetter<T> = (next: T[]) => void;

export const modifyOrderMenuData = <T extends Record<string, unknown>>(
  array: T[],
  setArray: ArraySetter<T>,
  index: number,
  property: keyof T | string,
  subProperty?: string,
  subIndex?: number,
  newValue?: unknown,
) => {
  const arrayUpdated = [...array];
  const target = arrayUpdated[index] as Record<string, unknown> | undefined;

  if (!target) {
    setArray(arrayUpdated);
    return;
  }

  const propKey = property as string;

  if (subProperty && typeof subIndex === 'number') {
    const list = target[propKey];
    if (Array.isArray(list)) {
      const item = list[subIndex] as Record<string, unknown> | undefined;
      if (item) {
        item[subProperty] = newValue;
      }
    }
  } else if (subProperty) {
    const nested = target[propKey];
    if (nested && typeof nested === 'object') {
      (nested as Record<string, unknown>)[subProperty] = newValue;
    } else {
      target[propKey] = { [subProperty]: newValue };
    }
  } else {
    target[propKey] = newValue;
  }

  setArray(arrayUpdated);
};
