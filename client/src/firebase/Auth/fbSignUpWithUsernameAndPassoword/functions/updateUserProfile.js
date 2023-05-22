import { updateProfile } from "firebase/auth";

export const updateUserProfile = async (userAuth, name) => {
    try {
      return await updateProfile(userAuth.user, {
        displayName: name,
      });
    } catch (error) {
      console.error('Error al actualizar el perfil del usuario:', error);
      throw error;
    }
  };