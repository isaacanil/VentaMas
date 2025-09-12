import { userAccess } from '../hooks/abilities/useAbilities';
import { isHiddenInMenu, getRouteMeta } from '../routes/routeVisibility';

/**
 * Función centralizada para filtrar elementos de menú basados en permisos de usuario
 * 
 * @param {Array} menuItems - Elementos de menú a filtrar
 * @param {boolean} hasSubmenu - Indica si los elementos tienen submenús (true) o son planos (false)
 * @return {Array} - Elementos de menú filtrados basados en permisos
 */
export const filterMenuItemsByAccess = (menuItems, hasSubmenu = false) => {
  const { abilities } = userAccess();
  
  if (!hasSubmenu) {
    // Elementos de menú planos (como en CardData.jsx)
    return menuItems
      .filter(item => abilities.can('access', item.route))
      .filter(item => !isHiddenInMenu(item.route, item))
      .map(item => {
        const meta = getRouteMeta(item.route);
        return meta ? { ...item, routeMeta: meta } : item;
      });
  }
  
  // Elementos de menú complejos con submenús (como en MenuData.jsx)
  const filterSubmenu = (submenu) => 
    submenu
      .filter(subItem => abilities.can('access', subItem.route))
      .filter(subItem => !isHiddenInMenu(subItem.route, subItem))
      .map(subItem => {
        const meta = getRouteMeta(subItem.route);
        return meta ? { ...subItem, routeMeta: meta } : subItem;
      });

  return menuItems.map(item => {
    if (item.submenu && item.submenu.length > 0) {
      const filteredSubmenu = filterSubmenu(item.submenu);
      if (filteredSubmenu.length > 0) {
        const meta = getRouteMeta(item.route);
        return { ...(meta ? { ...item, routeMeta: meta } : item), submenu: filteredSubmenu };
      }
      return null;
    } else {
      if (!abilities.can('access', item.route)) return null;
      if (isHiddenInMenu(item.route, item)) return null;
      const meta = getRouteMeta(item.route);
      return meta ? { ...item, routeMeta: meta } : item;
    }
  }).filter(item => item !== null);
};

/**
 * Verifica si un usuario tiene privilegios de desarrollador
 * 
 * @returns {boolean} - true si el usuario tiene acceso de desarrollador
 */
export const hasDeveloperAccess = () => {
  const { abilities } = userAccess();
  return abilities?.can('developerAccess', 'all');
};