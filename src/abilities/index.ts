import { getUserDynamicPermissions } from '@/services/dynamicPermissions';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

import { defineAbilitiesForAdmin } from './roles/admin';
import { defineAbilitiesForCashier } from './roles/cajero';
import { defineAbilitiesForBuyer } from './roles/comprador';
import { defineAbilitiesForDev } from './roles/dev';
import { defineAbilitiesForManager } from './roles/gerente';
import { defineAbilitiesForOwner } from './roles/owner';

const DEV_ACCESS_ACTION = 'developerAccess';
const DEV_ACCESS_SUBJECT = 'all';

const ROLE_ABILITIES = {
  ownerAbilities: defineAbilitiesForOwner, //dueño
  adminAbilities: defineAbilitiesForAdmin, //administrador
  managerAbilities: defineAbilitiesForManager, //gerente
  cashierAbilities: defineAbilitiesForCashier, //cajero
  buyerAbilities: defineAbilitiesForBuyer, //comprador
  devAbilities: defineAbilitiesForDev, //desarrollador
};

export function defineAbilitiesFor(user: any) {
  const baseAbilities = getBaseAbilitiesForRole(user);
  return enforceDeveloperAccess(user, normalizeRules(baseAbilities));
}

export async function defineAbilitiesForWithDynamic(user: any) {
  // Obtener permisos base del rol
  const baseAbilities = getBaseAbilitiesForRole(user);
  const resolvedBusinessId =
    user?.businessID ||
    user?.businessId ||
    user?.business?.id ||
    user?.business?.businessID ||
    null;

  // Si no hay user.uid o businessID, solo devolver permisos base
  if (!user?.uid || !resolvedBusinessId) {
    if (!resolvedBusinessId) {
      console.warn(
        'defineAbilitiesForWithDynamic: user missing businessID, using base abilities only',
      );
    }
    return enforceDeveloperAccess(user, normalizeRules(baseAbilities));
  }

  try {
    // Obtener permisos dinámicos de Firestore
    // Pasamos userId y currentUser en el orden correcto
    const userWithBusinessId =
      user?.businessID === resolvedBusinessId
        ? user
        : { ...user, businessID: resolvedBusinessId };

    const dynamicPermissions = await getUserDynamicPermissions(
      user.uid,
      userWithBusinessId,
    );

    // Combinar permisos base con dinámicos
    const combinedAbilities = combineAbilities(
      baseAbilities,
      dynamicPermissions,
    );
    return enforceDeveloperAccess(user, normalizeRules(combinedAbilities));
  } catch (error) {
    console.warn('Error loading dynamic permissions, using base only:', error);
    return enforceDeveloperAccess(user, normalizeRules(baseAbilities));
  }
}

function getBaseAbilitiesForRole(user: any) {
  const {
    adminAbilities,
    cashierAbilities,
    buyerAbilities,
    managerAbilities,
    ownerAbilities,
    devAbilities,
  } = ROLE_ABILITIES;
  const role = normalizeRoleId(user?.role);

  switch (role) {
    case 'owner':
      return ownerAbilities(user);
    case 'admin':
      return adminAbilities(user);
    case 'cashier':
      return cashierAbilities(user);
    case 'buyer':
      return buyerAbilities(user);
    case 'dev':
      return devAbilities(user);
    case 'manager':
      return managerAbilities(user);
    default:
      return []; // si no se reconoce el rol, no se dan habilidades
  }
}

function combineAbilities(baseAbilities: any, dynamicPermissions: any) {
  // Convertir abilities base a array si no lo es
  let combinedAbilities = Array.isArray(baseAbilities)
    ? [...baseAbilities]
    : baseAbilities.rules || [];

  // Agregar permisos adicionales (esto puede anular restricciones previas)
  if (dynamicPermissions.additionalPermissions) {
    dynamicPermissions.additionalPermissions.forEach((permission: any) => {
      // Primero, remover cualquier restricción existente para este permiso
      combinedAbilities = combinedAbilities.filter(
        (rule: any) =>
          !(
            rule.action === permission.action &&
            rule.subject === permission.subject &&
            rule.inverted === true
          ), // rule.inverted === true significa "cannot"
      );

      // Luego, verificar que no esté ya incluido como "can"
      const exists = combinedAbilities.some(
        (rule: any) =>
          rule.action === permission.action &&
          rule.subject === permission.subject &&
          !rule.inverted, // Solo verificar rules que son "can" (no inverted)
      );

      if (!exists) {
        combinedAbilities.push({
          action: permission.action,
          subject: permission.subject,
          inverted: false, // Explícitamente es un "can"
        });
      }
    });
  }

  // Agregar permisos restringidos (esto anula permisos previos)
  if (dynamicPermissions.restrictedPermissions) {
    dynamicPermissions.restrictedPermissions.forEach((restriction: any) => {
      // Remover cualquier permiso existente para esta acción/subject
      combinedAbilities = combinedAbilities.filter(
        (rule: any) =>
          !(
            rule.action === restriction.action &&
            rule.subject === restriction.subject
          ),
      );

      // Agregar la restricción explícita
      combinedAbilities.push({
        action: restriction.action,
        subject: restriction.subject,
        inverted: true, // Esto es un "cannot"
      });
    });
  }

  return combinedAbilities;
}

function normalizeRules(rules: any): any[] {
  if (Array.isArray(rules)) return [...rules];
  if (rules?.rules && Array.isArray(rules.rules)) return [...rules.rules];
  return [];
}

function enforceDeveloperAccess(user: any, rules: any[]) {
  const isDev = normalizeRoleId(user?.role) === 'dev';

  if (isDev) {
    return rules;
  }

  const filtered = rules.filter(
    (rule: any) => rule?.action !== DEV_ACCESS_ACTION,
  );

  const hasExplicitDeny = filtered.some(
    (rule: any) =>
      rule?.action === DEV_ACCESS_ACTION &&
      rule?.subject === DEV_ACCESS_SUBJECT &&
      rule?.inverted === true,
  );

  if (!hasExplicitDeny) {
    filtered.push({
      action: DEV_ACCESS_ACTION,
      subject: DEV_ACCESS_SUBJECT,
      inverted: true,
    });
  }

  return filtered;
}
