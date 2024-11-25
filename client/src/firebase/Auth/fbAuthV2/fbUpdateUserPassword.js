import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { hash } from 'bcryptjs';

const db = getFirestore();

export const fbUpdateUserPassword = async (userId, newPassword) => {
  try {
    const encryptedPassword = await hash(newPassword, 10); // The second argument is the salt rounds

    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      'user.password': encryptedPassword,
    });
  } catch (error) {
    console.error('Error updating password:', error);
  }
};

