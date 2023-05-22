import { createUserWithEmailAndPassword } from "firebase/auth";

export const registerUser = async (auth, email, pass) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      throw error;
    }
  };