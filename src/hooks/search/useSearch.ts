import { useMemo } from 'react';

import { filterData } from '@/utils/search/filterData';

const useFilter = <T>(data: T[] = [], searchTerm = ''): T[] => {
  return useMemo(() => filterData(data, searchTerm) ?? data, [data, searchTerm]);
};

export default useFilter;
