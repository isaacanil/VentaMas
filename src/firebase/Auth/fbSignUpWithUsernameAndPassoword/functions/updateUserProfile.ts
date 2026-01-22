import { updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';

export const updateUserProfile = async (
  user: User,
  name: string,
): Promise<void> => {
  try {
    await updateProfile(user, {
      displayName: name,
    });
  } catch (error) {
    console.error('Error al actualizar el perfil del usuario:', error);
    throw error;
  }
};
