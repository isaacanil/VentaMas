import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseconfig";

export const saveUserData = async (userAuth, user) => {
  const { name, email, businessID, rol } = user;
  try {
    const uid = userAuth.user.uid;
    const userRef = doc(db, 'users', uid);
    return await setDoc(userRef, {
      user: {
        id: uid,
        name: name,
        email: email,
        businessID: businessID,
        active: true,
        rol
      }
    });
  } catch (error) {
    console.error('Error al guardar los datos del usuario:', error);
    throw error;
  }
};
