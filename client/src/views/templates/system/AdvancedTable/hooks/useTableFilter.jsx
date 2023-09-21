import { useState, useEffect } from 'react';


export const applyFilters = (data, filters) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  if (!filters) {
    return data;
  }

  return data.filter(item => {
    return Object.keys(filters).every(filterKey => {
      return item[filterKey] === filters[filterKey];
    });
  });
};

const generateFilterOptions = (data, accessor) => {
  const uniqueValues = [...new Set(data.map(item => item[accessor]))];
  return uniqueValues.map(value => ({ label: value, value }));
};

export const useDynamicFilterConfig = (initialFilterConfig = [], data = []) => {

  if(!initialFilterConfig || !Array.isArray(initialFilterConfig)) {
    throw new Error('initialFilterConfig debe ser un array');
  }

  if(!data || !Array.isArray(data)) {
    throw new Error('data debe ser un array');
  }

  const [dynamicFilterConfig, setDynamicFilterConfig] = useState(initialFilterConfig);

  useEffect(() => {
    const newFilterConfig = initialFilterConfig.map(filter => {
      return {
        ...filter,
        options: generateFilterOptions(data, filter.accessor)
      };
    });

    // Solo actualizamos el estado si newFilterConfig es diferente de dynamicFilterConfig
    if (JSON.stringify(newFilterConfig) !== JSON.stringify(dynamicFilterConfig)) {
      setDynamicFilterConfig(newFilterConfig);
    }
  }, [data, initialFilterConfig]);

  return dynamicFilterConfig;
};


const useTableFiltering = (filterConfig, data) => {
  const defaultFilter = filterConfig.reduce((acc, curr) => {
    if (curr.defaultValue !== undefined) {
      acc[curr.accessor] = curr.defaultValue;
    }
    return acc;
  }, {});

  const [filter, setFilter] = useState(defaultFilter);

  const setDefaultFilter = () => {
    setFilter(defaultFilter);
  };

  const filteredData = applyFilters(data, filter);

  return [filter, setFilter, setDefaultFilter, defaultFilter, filteredData];
};

export default useTableFiltering;







