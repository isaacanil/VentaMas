import { ROUTES } from '@/router/routes/routesName';

type RouteEntry = {
  name: string;
  path: string;
  category: string;
};

export const getAllRoutes = (): RouteEntry[] => {
  const routes: RouteEntry[] = [];

  // Función recursiva para extraer rutas de un objeto
  const extractRoutes = (obj: Record<string, unknown>, prefix = '') => {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (typeof value === 'string' && value.startsWith('/')) {
        // Es una ruta
        routes.push({
          name: key,
          path: value,
          category: prefix || 'General',
        });
      } else if (typeof value === 'object' && value !== null) {
        // Es un objeto anidado, recursión
        extractRoutes(value as Record<string, unknown>, key);
      }
    });
  };

  extractRoutes(ROUTES);
  return routes;
};

export const filterRoutes = (searchText: string) => {
  const allRoutes = getAllRoutes();
  if (!searchText) return allRoutes;

  const search = searchText.toLowerCase();
  return allRoutes.filter(
    (route) =>
      route.name.toLowerCase().includes(search) ||
      route.path.toLowerCase().includes(search) ||
      route.category.toLowerCase().includes(search),
  );
};
