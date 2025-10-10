import { getUserDynamicPermissions } from '../services/dynamicPermissions';

import { defineAbilitiesForAdmin } from './roles/admin';
import { defineAbilitiesForCashier } from './roles/cajero';
import { defineAbilitiesForBuyer } from './roles/comprador';
import { defineAbilitiesForDev } from './roles/dev';
import { defineAbilitiesForManager } from './roles/gerente';
import { defineAbilitiesForOwner } from './roles/owner';



const ROLE_ABILITIES = {
  ownerAbilities: defineAbilitiesForOwner,  //dueño
  adminAbilities: defineAbilitiesForAdmin, //administrador
  managerAbilities: defineAbilitiesForManager, //gerente
  cashierAbilities: defineAbilitiesForCashier, //cajero
  buyerAbilities: defineAbilitiesForBuyer,//comprador
  devAbilities: defineAbilitiesForDev, //desarrollador
};

export function defineAbilitiesFor(user) {
  return getBaseAbilitiesForRole(user);
}

export async function defineAbilitiesForWithDynamic(user) {
  // Obtener permisos base del rol
  const baseAbilities = getBaseAbilitiesForRole(user);
  const resolvedBusinessId = user?.businessID
    || user?.businessId
    || user?.business?.id
    || user?.business?.businessID
    || null;

  // Si no hay user.uid o businessID, solo devolver permisos base
  if (!user?.uid || !resolvedBusinessId) {
    if (!resolvedBusinessId) {
      console.warn('defineAbilitiesForWithDynamic: user missing businessID, using base abilities only');
    }
    return baseAbilities;
  }
  
  try {
    // Obtener permisos dinámicos de Firestore
    // Pasamos userId y currentUser en el orden correcto
    const userWithBusinessId = user?.businessID === resolvedBusinessId
      ? user
      : { ...user, businessID: resolvedBusinessId };

    const dynamicPermissions = await getUserDynamicPermissions(user.uid, userWithBusinessId);
  
    // Combinar permisos base con dinámicos
    return combineAbilities(baseAbilities, dynamicPermissions);
  } catch (error) {
    console.warn('Error loading dynamic permissions, using base only:', error);
    return baseAbilities;
  }
}

function getBaseAbilitiesForRole(user) {
  const { adminAbilities, cashierAbilities, buyerAbilities, managerAbilities, ownerAbilities, devAbilities } = ROLE_ABILITIES
  switch (user.role) {
    case 'owner':
      return ownerAbilities(user);
    case 'admin':
      return adminAbilities(user);
    case 'cashier':
    case 'specialCashier1': // Migración: ahora usa cashier base
    case 'specialCashier2': // Migración: ahora usa cashier base
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

function combineAbilities(baseAbilities, dynamicPermissions) {
  // Convertir abilities base a array si no lo es
  let combinedAbilities = Array.isArray(baseAbilities) ? [...baseAbilities] : baseAbilities.rules || [];
  
  // Agregar permisos adicionales (esto puede anular restricciones previas)
  if (dynamicPermissions.additionalPermissions) {
    dynamicPermissions.additionalPermissions.forEach(permission => {
      // Primero, remover cualquier restricción existente para este permiso
      combinedAbilities = combinedAbilities.filter(rule => 
        !(rule.action === permission.action && 
          rule.subject === permission.subject && 
          rule.inverted === true) // rule.inverted === true significa "cannot"
      );
      
      // Luego, verificar que no esté ya incluido como "can"
      const exists = combinedAbilities.some(rule => 
        rule.action === permission.action && 
        rule.subject === permission.subject &&
        !rule.inverted // Solo verificar rules que son "can" (no inverted)
      );
      
      if (!exists) {
        combinedAbilities.push({
          action: permission.action,
          subject: permission.subject,
          inverted: false // Explícitamente es un "can"
        });
      }
    });
  }
  
  // Agregar permisos restringidos (esto anula permisos previos)
  if (dynamicPermissions.restrictedPermissions) {
    dynamicPermissions.restrictedPermissions.forEach(restriction => {
      // Remover cualquier permiso existente para esta acción/subject
      combinedAbilities = combinedAbilities.filter(rule => 
        !(rule.action === restriction.action && rule.subject === restriction.subject)
      );
      
      // Agregar la restricción explícita
      combinedAbilities.push({
        action: restriction.action,
        subject: restriction.subject,
        inverted: true // Esto es un "cannot"
      });
    });
  }
  
  return combinedAbilities;
}








