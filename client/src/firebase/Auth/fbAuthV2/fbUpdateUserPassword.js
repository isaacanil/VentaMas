import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { hash } from 'bcryptjs';

// Assuming Firebase app and Firestore have already been initialized
const db = getFirestore();

export const fbUpdateUserPassword = async (userId, newPassword) => {
  try {
    // Encrypt the new password
    const encryptedPassword = await hash(newPassword, 10); // The second argument is the salt rounds

    // Reference to the user's document
    const userRef = doc(db, 'users', userId);

    // Update the password in Firestore
    await updateDoc(userRef, {
      'user.password': encryptedPassword,
    });

    console.log('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
  }
};

// Example usage
// fbUpdateUserPassword('userId', 'newPassword');
