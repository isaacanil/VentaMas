import type { MenuItem } from '@/types/menu';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { isHiddenInMenu, getRouteMeta } from '@/router/routes/routeVisibility';

/**
 * Función centralizada para filtrar elementos de menú basados en permisos de usuario
 *
 * @param {Array} menuItems - Elementos de menú a filtrar
 * @param {boolean} hasSubmenu - Indica si los elementos tienen submenús (true) o son planos (false)
 * @return {Array} - Elementos de menú filtrados basados en permisos
 */
export const useFilterMenuItemsByAccess = (
  menuItems: MenuItem[],
  hasSubmenu = false,
): MenuItem[] => {
  const { abilities, loading } = useUserAccess();
  const developerAccess = abilities?.can('developerAccess', 'all');
  const manageAllAccess = abilities?.can('manage', 'all');

  // Si abilities no está disponible o está cargando, retornar array vacío
  if (!abilities || loading) {
    return [];
  }

  const hasRouteMetaAccess = (route?: string): boolean => {
    if (!route) return false;
    const routeMeta = getRouteMeta(route);
    if (!routeMeta) return true;
    if (routeMeta.requiresDevAccess && !developerAccess) return false;
    if (routeMeta.requiresManageAllAccess && !manageAllAccess) return false;
    if (Array.isArray(routeMeta.requiredCapabilities) && routeMeta.requiredCapabilities.length) {
      const mode = routeMeta.requiredCapabilitiesMode === 'all' ? 'all' : 'any';
      const checks = routeMeta.requiredCapabilities.map((capability) =>
        abilities.can(capability, 'all'),
      );
      const allowed =
        mode === 'all' ? checks.every(Boolean) : checks.some(Boolean);
      if (!allowed) return false;
    }
    return true;
  };

  const hasRouteCapabilityGrant = (route?: string): boolean => {
    if (!route) return false;
    const routeMeta = getRouteMeta(route);
    if (!routeMeta) return false;
    if (!Array.isArray(routeMeta.requiredCapabilities) || !routeMeta.requiredCapabilities.length) {
      return false;
    }

    const mode = routeMeta.requiredCapabilitiesMode === 'all' ? 'all' : 'any';
    const checks = routeMeta.requiredCapabilities.map((capability) =>
      abilities.can(capability, 'all'),
    );
    return mode === 'all' ? checks.every(Boolean) : checks.some(Boolean);
  };

  const attachRouteMeta = (item: MenuItem): MenuItem => {
    if (!item.route) return item;
    const meta = getRouteMeta(item.route);
    return meta ? { ...item, routeMeta: meta } : item;
  };

  const canAccessRoute = (route?: string): boolean => {
    if (!route) return false;
    if (!hasRouteMetaAccess(route)) return false;
    return abilities.can('access', route) || hasRouteCapabilityGrant(route);
  };

  const filterMenuItemRecursive = (item: MenuItem): MenuItem | null => {
    if (item?.requiresDevAccess && !developerAccess) {
      return null;
    }

    const filteredSubmenu = Array.isArray(item.submenu)
      ? item.submenu
          .map(filterMenuItemRecursive)
          .filter((submenuItem): submenuItem is MenuItem => submenuItem !== null)
      : [];

    if (filteredSubmenu.length > 0) {
      return {
        ...attachRouteMeta(item),
        submenu: filteredSubmenu,
      };
    }

    if (item.action && !item.route) return item;
    if (!item.route) return null;
    if (!canAccessRoute(item.route)) return null;
    if (isHiddenInMenu(item.route, item)) return null;
    return attachRouteMeta(item);
  };

  if (!hasSubmenu) {
    // Elementos de menú planos (como en CardData.tsx)
    return menuItems
      .filter((item) => {
        if (item.action && !item.route) return true;
        if (!item.route) return false;
        return canAccessRoute(item.route);
      })
      .filter((item) => (item.route ? !isHiddenInMenu(item.route, item) : true))
      .map(attachRouteMeta);
  }

  // Elementos de menú complejos con submenús (como en MenuData.tsx)
  return menuItems
    .map(filterMenuItemRecursive)
    .filter((item): item is MenuItem => item !== null);
};

/**
 * Verifica si un usuario tiene privilegios de desarrollador
 *
 * @returns {boolean} - true si el usuario tiene acceso de desarrollador
 */
export const useHasDeveloperAccess = () => {
  const { abilities } = useUserAccess();
  return abilities?.can('developerAccess', 'all') ?? false;
};
