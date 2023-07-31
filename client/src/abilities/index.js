import { defineAbilitiesForManager } from './roles/gerente';
import { defineAbilitiesForCashier } from './roles/cajero';
import { defineAbilitiesForBuyer } from './roles/comprador';
import { defineAbilitiesForAdmin } from './roles/admin';
import { defineAbilitiesForOwner } from './roles/owner';
import { defineAbilitiesForDev } from './roles/dev';


const ROLE_ABILITIES = {
  ownerAbilities: defineAbilitiesForOwner,  //dueño
  adminAbilities: defineAbilitiesForAdmin, //administrador
  managerAbilities: defineAbilitiesForManager, //gerente
  cashierAbilities: defineAbilitiesForCashier, //cajero
  buyerAbilities: defineAbilitiesForBuyer,//comprador
  devAbilities: defineAbilitiesForDev, //desarrollador
};

export function defineAbilitiesFor(user) {
  const { adminAbilities, cashierAbilities, buyerAbilities, managerAbilities, ownerAbilities, devAbilities } = ROLE_ABILITIES
  switch (user.role) {
    case 'owner':
      return ownerAbilities(user);
    case 'admin':
      return adminAbilities(user);
    case 'cashier':
      return cashierAbilities(user);
    case 'buyer':
      return buyerAbilities(user);
    case 'dev':
      return defineAbilitiesForDev(user);
    case 'manager':
      return managerAbilities(user);
    default:
      return []; // si no se reconoce el rol, no se dan habilidades
  }
}











