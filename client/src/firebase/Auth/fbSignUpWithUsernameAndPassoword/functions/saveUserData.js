import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseconfig";

export const saveUserData = async (userAuth, user) => {
  
  try {
    const uid = userAuth.user.uid;
    const userRef = doc(db, 'users', uid);
    return await setDoc(userRef, {
      user: {
        ...user,
        id: uid,
        active: true,
        createAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Error al guardar los datos del usuario:', error);
    throw error;
  }
};
