import { auth } from "../../firebaseconfig";

import { navigateSafely } from "./functions/navigateUser";
import { registerUser } from "./functions/registerUser";
import { validateInputs } from "./functions/validateInputs";


export const fbSignUpUserAccount = async (user, navigate) => { 
  try {
    validateInputs(user);
    await registerUser(auth, user);
    await navigateSafely(navigate, '/users/list');
  } catch (error) {
    console.error('Error in handleRegister:', error);
    throw error;
  }
};







