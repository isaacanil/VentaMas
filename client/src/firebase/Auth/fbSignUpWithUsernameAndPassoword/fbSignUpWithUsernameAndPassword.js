import { updateUserProfile } from "./functions/updateUserProfile";
import { saveUserData } from "./functions/saveUserData";
import { registerUser } from "./functions/registerUser";
import { auth } from "../../firebaseconfig";
import { validateInputs } from "./functions/validateInputs";
import { navigateSafely } from "./functions/navigateUser";


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







