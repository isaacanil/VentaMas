import { useMemo } from 'react';

type ClientWrapper = { client: { name?: string } };

type SearchableRecord = Record<string, unknown>;

export const useSearchFilter = <T extends ClientWrapper>(
  clients: T[],
  searchTerm: string,
) => {
  const filteredClients = useMemo(() => {
    if (String(searchTerm).trim() === '') {
      return clients;
    }
    const searchRegex = new RegExp(searchTerm, 'i');
    return clients.filter(({ client }) => searchRegex.test(client.name ?? ''));
  }, [clients, searchTerm]);
  return filteredClients;
};

export const useSearchFilterX = <T extends SearchableRecord>(
  list: T[],
  searchTerm: string,
  filterField: string,
) => {
  const filteredList = useMemo(() => {
    if (String(searchTerm).trim() === '') {
      return list;
    }
    const searchRegex = new RegExp(searchTerm, 'i');
    return list.filter((item) => {
      const [parentKey, childKey] = filterField.split('.');
      const parentValue = item[parentKey] as SearchableRecord | undefined;
      const childValue = parentValue?.[childKey];
      return searchRegex.test(String(childValue ?? ''));
    });
  }, [list, searchTerm, filterField]);
  return filteredList;
};

export const useSearchFilterOrderMenuOption = <T extends { name?: string }>(
  data: T[],
  searchTerm: string,
) => {
  const filteredData = useMemo(() => {
    if (String(searchTerm).trim() === '') {
      return data;
    }
    const searchRegex = new RegExp(searchTerm, 'i');
    const filtered = data.filter((item) => searchRegex.test(item.name ?? ''));
    return filtered.slice(0, 3);
  }, [searchTerm, data]);
  return filteredData;
};

export function searchAndFilter<T extends { product: SearchableRecord }>(
  products: T[],
  searchQuery: string,
) {
  const searchTerms = searchQuery.trim().toLowerCase().split(' ');

  const deepStringify = (obj: unknown): string => {
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }

    return Object.values(obj)
      .map((value) => deepStringify(value))
      .join(' ');
  };

  return products.filter(({ product }) => {
    const productString = deepStringify(product).toLowerCase();
    return searchTerms.every((term) => productString.includes(term));
  });
}

export const filtrarDatos = <T extends SearchableRecord>(
  array: T[],
  searchTerm: string,
) => {
  if (!searchTerm) {
    return array;
  }
  const term = searchTerm.toLowerCase();
  return array.filter((item) => buscarEnPropiedades(item, term));
};

const buscarEnPropiedades = (objeto: SearchableRecord, term: string) => {
  return Object.values(objeto).some((value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return value.toString().toLowerCase().includes(term);
    }
    if (Array.isArray(value)) {
      return value.some((item) => buscarEnPropiedades(item as SearchableRecord, term));
    }
    if (typeof value === 'object' && value !== null) {
      return buscarEnPropiedades(value as SearchableRecord, term);
    }
    return false;
  });
};
