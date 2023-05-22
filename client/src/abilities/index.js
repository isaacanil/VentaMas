// src/abilities/index.js

import { defineAbilitiesForAdmin } from './roles/admin';
import { defineAbilitiesForGerente } from './roles/gerente';
import { defineAbilitiesForCajero } from './roles/cajero';
import { defineAbilitiesForComprador } from './roles/comprador';

import { createMongoAbility, defineAbility } from '@casl/ability';

const ROLE_ABILITIES = {
    admin: defineAbilitiesForAdmin,
    gerente: defineAbilitiesForGerente,
    cajero: defineAbilitiesForCajero,
    comprador: defineAbilitiesForComprador,
};

export function defineAbilitiesFor(role) {
    const defineAbilities = ROLE_ABILITIES[role];

    if (typeof defineAbilities !== 'function') {
        // Rol no reconocido, devuelve una Ability vacía
        return createMongoAbility(() => { });
    }

    return defineAbility();
}