export const BUSINESS_MANAGER_QUERY_KEY = 'businessManager';
export const BUSINESS_MANAGER_QUERY_VALUE = 'open';

const splitPathAndSearch = (
  path: string,
): { pathname: string; searchParams: URLSearchParams } => {
  const [pathname, rawSearch = ''] = path.split('?');
  return {
    pathname,
    searchParams: new URLSearchParams(rawSearch),
  };
};

const buildPathWithSearch = (
  pathname: string,
  searchParams: URLSearchParams,
): string => {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const withBusinessManagerQuery = (path: string): string => {
  const { pathname, searchParams } = splitPathAndSearch(path);
  searchParams.set(BUSINESS_MANAGER_QUERY_KEY, BUSINESS_MANAGER_QUERY_VALUE);
  return buildPathWithSearch(pathname, searchParams);
};

export const hasBusinessManagerQuery = (search: string): boolean => {
  const params = new URLSearchParams(search);
  return params.get(BUSINESS_MANAGER_QUERY_KEY) === BUSINESS_MANAGER_QUERY_VALUE;
};

export const withoutBusinessManagerQuery = (path: string): string => {
  const { pathname, searchParams } = splitPathAndSearch(path);
  searchParams.delete(BUSINESS_MANAGER_QUERY_KEY);
  return buildPathWithSearch(pathname, searchParams);
};

