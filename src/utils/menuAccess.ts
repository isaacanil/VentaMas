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

  // Si abilities no está disponible o está cargando, retornar array vacío
  if (!abilities || loading) {
    return [];
  }

  const attachRouteMeta = (item: MenuItem): MenuItem => {
    if (!item.route) return item;
    const meta = getRouteMeta(item.route);
    return meta ? { ...item, routeMeta: meta } : item;
  };

  if (!hasSubmenu) {
    // Elementos de menú planos (como en CardData.tsx)
    return menuItems
      .filter((item) => {
        if (item.action && !item.route) return true;
        if (!item.route) return false;
        return abilities.can('access', item.route);
      })
      .filter((item) =>
        item.route ? !isHiddenInMenu(item.route, item) : true,
      )
      .map(attachRouteMeta);
  }

  // Elementos de menú complejos con submenús (como en MenuData.tsx)
  const filterSubmenu = (submenu: MenuItem[]) =>
    submenu
      .filter((subItem) => !(subItem?.requiresDevAccess && !developerAccess))
      .filter((subItem) => {
        if (subItem.action && !subItem.route) return true;
        if (!subItem.route) return false;
        return abilities.can('access', subItem.route);
      })
      .filter((subItem) =>
        subItem.route ? !isHiddenInMenu(subItem.route, subItem) : true,
      )
      .map(attachRouteMeta);

  return menuItems
    .map((item) => {
      if (item?.requiresDevAccess && !developerAccess) {
        return null;
      }
      if (item.submenu && item.submenu.length > 0) {
        const filteredSubmenu = filterSubmenu(item.submenu);
        if (filteredSubmenu.length > 0) {
          const nextItem = attachRouteMeta(item);
          return { ...nextItem, submenu: filteredSubmenu };
        }
        return null;
      } else {
        if (item.action && !item.route) return item;
        if (!item.route) return null;
        if (!abilities.can('access', item.route)) return null;
        if (isHiddenInMenu(item.route, item)) return null;
        return attachRouteMeta(item);
      }
    })
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
