function defineAbilitiesForComprador() {
    return createMongoAbility((can) => {
      can([ACTIONS.READ, ACTIONS.CREATE], [SUBJECTS.PRODUCTS, SUBJECTS.ORDERS]);
    });
  }

    export default defineAbilitiesForComprador;