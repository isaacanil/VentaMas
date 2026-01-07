import { ROUTES } from '@/router/routes/routesName';

export const getAllRoutes = () => {
  const routes = [];

  // Función recursiva para extraer rutas de un objeto
  const extractRoutes = (obj, prefix = '') => {
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
        extractRoutes(value, key);
      }
    });
  };

  extractRoutes(ROUTES);
  return routes;
};

export const filterRoutes = (searchText) => {
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
