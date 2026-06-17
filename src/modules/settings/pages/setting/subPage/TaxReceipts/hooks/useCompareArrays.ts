import { useMemo } from 'react';

import { isEqual } from '@/utils/lodash-minimal';

export const useCompareArrays = <T>(array1: T[], array2: T[]): boolean => {
  return useMemo(() => {
    if (array1.length !== array2.length) return false;

    for (let i = 0; i < array1.length; i++) {
      if (!isEqual(array1[i], array2[i])) return false;
    }

    return true;
  }, [array1, array2]);
};
