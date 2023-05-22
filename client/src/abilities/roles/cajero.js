
  
  function defineAbilitiesForCajero() {
    return createMongoAbility((can) => {
      can([ACTIONS.READ, ACTIONS.CREATE], [SUBJECTS.PRODUCTS, SUBJECTS.SALES, SUBJECTS.INVOICES]);
    });
  }
  

    export default defineAbilitiesForCajero;