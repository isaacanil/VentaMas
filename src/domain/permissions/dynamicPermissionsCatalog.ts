import type {
  PermissionDefinition,
  RolePermissionsInfo,
} from '@/types/permissions';
import type { UserRoleLike } from '@/types/users';

export const ROLE_PERMISSION_KEYS = [
  'cashier',
  'admin',
  'manager',
  'buyer',
] as const;

export type PermissionRoleKey = (typeof ROLE_PERMISSION_KEYS)[number];

export type PermissionCatalogKey = PermissionRoleKey | 'general';

const isPermissionRoleKey = (
  role?: UserRoleLike | null,
): role is PermissionRoleKey =>
  ROLE_PERMISSION_KEYS.includes(role as PermissionRoleKey);

// Permisos disponibles organizados por rol
// Cada rol tiene sus propios permisos dinámicos disponibles
export const AVAILABLE_PERMISSIONS_BY_ROLE: Record<
  PermissionCatalogKey,
  PermissionDefinition[]
> = {
  // Permisos dinámicos para cajeros
  cashier: [
    {
      action: 'read',
      subject: 'PriceList',
      label: 'Ver lista de precios en carrito',
      description:
        'Permite consultar la lista de precios mientras se toma una venta desde el carrito.',
      category: 'Ventas · Carrito',
    },
    {
      action: 'modify',
      subject: 'Price',
      label: 'Modificar precios en facturación',
      description:
        'Autoriza actualizar manualmente los precios durante la facturación.',
      category: 'Ventas · Carrito',
    },
  ],

  // Permisos dinámicos para administradores (por si en el futuro se necesita)
  admin: [
    // Los admins normalmente tienen 'manage all', pero por si se quiere restringir algo específico
    // { action: 'developerAccess', subject: 'all', label: 'Acceso de Desarrollador', category: 'system' },
  ],

  // Permisos dinámicos para managers (para futuro)
  manager: [
    // { action: 'access', subject: 'Reports', label: 'Acceso a Reportes Avanzados', category: 'reports' },
    // { action: 'manage', subject: 'Discounts', label: 'Gestionar Descuentos', category: 'sales' },
  ],

  // Permisos dinámicos para compradores (para futuro)
  buyer: [
    // { action: 'access', subject: 'Analytics', label: 'Acceso a Analíticas', category: 'analytics' },
    // { action: 'export', subject: 'Data', label: 'Exportar Datos', category: 'data' },
  ],

  // Permisos generales disponibles para cualquier rol
  general: [
    // { action: 'access', subject: 'HelpDesk', label: 'Acceso a Mesa de Ayuda', category: 'support' },
  ],
};

// Lista completa de permisos disponibles (para compatibilidad con código existente)
export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  ...AVAILABLE_PERMISSIONS_BY_ROLE.cashier,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.admin,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.manager,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.buyer,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.general,
];

/**
 * Obtiene los permisos dinámicos disponibles para un rol específico
 * @param role - El rol del usuario (cajero, admin, manager, buyer)
 * @returns Lista de permisos disponibles para ese rol
 */
export const getAvailablePermissionsForRole = (
  role?: UserRoleLike | null,
): PermissionDefinition[] => {
  const rolePermissions = isPermissionRoleKey(role)
    ? AVAILABLE_PERMISSIONS_BY_ROLE[role]
    : [];
  const generalPermissions = AVAILABLE_PERMISSIONS_BY_ROLE.general || [];
  return [...rolePermissions, ...generalPermissions];
};

/**
 * Obtiene información sobre qué permisos están disponibles para un rol específico
 * @param role - El rol del usuario
 * @returns Información sobre los permisos disponibles
 */
export const getRolePermissionsInfo = (
  role?: UserRoleLike | null,
): RolePermissionsInfo => {
  const rolePermissions = isPermissionRoleKey(role)
    ? AVAILABLE_PERMISSIONS_BY_ROLE[role]
    : [];
  const generalPermissions = AVAILABLE_PERMISSIONS_BY_ROLE.general || [];

  return {
    roleName: role ?? null,
    roleSpecificCount: rolePermissions.length,
    generalCount: generalPermissions.length,
    totalAvailable: rolePermissions.length + generalPermissions.length,
    categories: [
      ...new Set([
        ...rolePermissions.map((p) => p.category),
        ...generalPermissions.map((p) => p.category),
      ]),
    ].filter((category): category is string => Boolean(category)),
  };
};
