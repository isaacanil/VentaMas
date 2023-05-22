
function defineAbilitiesForAdmin() {
    return createMongoAbility((can) => {
      can(ACTIONS.MANAGE, SUBJECTS.ALL);
    });
  }
  
    export default defineAbilitiesForAdmin;
  