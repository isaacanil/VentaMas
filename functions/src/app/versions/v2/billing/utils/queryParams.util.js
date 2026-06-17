import { URL } from 'node:url';

export const appendQueryParams = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};
