export const stripTrailingSlash = (path: string): string => {
  if (!path) return path;
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

export const stripLeadingSlash = (path: string): string =>
  path.startsWith('/') ? path.slice(1) : path;

export const joinRoutePath = (
  basePath: string,
  childPath?: string | null,
): string => {
  if (!childPath) return basePath;
  if (childPath.startsWith('/')) return childPath;
  if (!basePath || basePath === '/') return `/${childPath}`;
  return `${stripTrailingSlash(basePath)}/${stripLeadingSlash(childPath)}`;
};

export const getLastRouteSegment = (path: string): string => {
  const parts = stripTrailingSlash(path).split('/');
  return parts[parts.length - 1] || '';
};

export const getRelativeRoutePath = (
  fullPath: string,
  basePath: string,
): string => {
  const normalizedBasePath = `${stripTrailingSlash(basePath)}/`;
  return fullPath.replace(normalizedBasePath, '');
};
