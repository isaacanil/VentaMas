function defineAbilitiesForGerente() {
    return createMongoAbility((can) => {
      can([ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CREATE], [SUBJECTS.PRODUCTS, SUBJECTS.CATEGORIES, SUBJECTS.ORDERS, SUBJECTS.PURCHASES, SUBJECTS.SALES, SUBJECTS.INVOICES]);
    });
  }

    export default defineAbilitiesForGerente;