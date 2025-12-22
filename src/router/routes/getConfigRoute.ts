import ROUTES_NAME from './routesName';

/**
 * Función genérica multipropósito para manejar rutas.
 * Puede construir una ruta completa a partir de una base y una sección,
 * o extraer la parte relativa de una ruta completa.
 *
 * @param {string} basePath - La ruta base o la ruta completa
 * @param {string} [section] - La sección o subruta específica (opcional)
 * @returns {string} La ruta manipulada según los parámetros
 *
 * @example
 * // Modo 1: Combinar ruta base con sección
 * const fullPath = getRoutePath('/settings', 'users'); // '/settings/users'
 *
 * @example
 * // Modo 2: Extraer parte relativa de una ruta completa
 * const relativePath = getRoutePath('/settings/users', null); // 'users'
 * // O simplemente
 * const relativePath = getRoutePath('/settings/users'); // 'users'
 */
export function getRoutePath(
  basePath: string,
  section?: string | null,
): string {
  // Si no hay sección, estamos extrayendo la parte relativa
  if (section === undefined || section === null) {
    const parts = basePath.split('/');
    return parts[parts.length - 1] || ''; // Devuelve la última parte de la ruta
  }

  // Estamos combinando base con sección
  // Eliminar barra final de la base si existe
  const cleanBasePath = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath;

  // Eliminar barra inicial de la sección si existe
  const cleanSection = section.startsWith('/') ? section.slice(1) : section;

  // Construir y devolver la ruta completa
  return `${cleanBasePath}/${cleanSection}`;
}

/**
 * Extrae la parte relativa de una ruta a partir de una ruta base.
 *
 * @param {string} fullPath - La ruta completa
 * @param {string} basePath - La ruta base que se eliminará de la ruta completa
 * @returns {string} La parte relativa de la ruta
 *
 * @example
 * // Extraer la parte relativa de una ruta
 * const relativePath = getRelativePath('/settings/users', '/settings'); // 'users'
 */
export function getRelativePath(fullPath: string, basePath: string): string {
  // Asegurarse de que basePath termine con una barra
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;

  // Reemplazar la base en la ruta completa
  return fullPath.replace(normalizedBasePath, '');
}

/**
 * Obtiene la ruta completa para una sección específica de la configuración general.
 *
 * @param {string} section - La sección de configuración que se desea navegar.
 * @returns {string} La ruta completa para la sección de configuración especificada
 *
 * @deprecated Usar getRoutePath en su lugar
 */
export function getConfigRoute(section: string): string {
  const { SETTING } = ROUTES_NAME.SETTING_TERM;

  // Mapear la sección a su correspondiente ruta
  let sectionPath: string;
  switch (section) {
    case 'billing':
      sectionPath = 'billing';
      break;
    case 'business':
      sectionPath = 'business';
      break;
    case 'taxReceipt':
      sectionPath = 'tax-receipt';
      break;
    case 'users':
      sectionPath = 'users';
      break;
    case 'appInfo':
      sectionPath = 'app-info';
      break;
    default:
      return SETTING; // Ruta base por defecto
  }

  // Usar la nueva función genérica
  return getRoutePath(SETTING, sectionPath);
}

/**
 * Determina el identificador de sección basado en una ruta.
 *
 * @param {string} path - La ruta actual para determinar la sección activa
 * @returns {string} El identificador de la sección ('billing', 'business', etc.)
 *
 * @example
 * // Obtener el identificador de sección de una ruta
 * const sectionId = getConfigSectionFromPath('/general-config/users'); // 'users'
 */
export function getConfigSectionFromPath(path: string): string {
  if (path.includes('business')) return 'business';
  if (path.includes('tax-receipt')) return 'taxReceipt';
  if (path.includes('users')) return 'users';
  if (path.includes('app-info')) return 'appInfo';
  return 'billing'; // Valor predeterminado
}
