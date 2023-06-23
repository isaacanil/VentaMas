import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export const fbDeleteUser = async (uid, password) => {
    const userDocRef = doc(db, 'users', uid);
    
    // Obtiene los datos del usuario antes de intentar borrarlo
    let userData = null;
    try {
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
            userData = docSnapshot.data();
        } else {
            console.error(`User ${uid} not found in database`);
            return;
        }
    } catch (error) {
        console.error(`Error fetching user data: ${error}`);
        return;
    }

    // Intenta borrar el documento de la base de datos
    try {
        await deleteDoc(userDocRef);
        console.log(`User ${uid} deleted from database!`);
    } catch (error) {
        console.error(`Error deleting user from database: ${error}`);
        return; // Si falla, no intenta borrar la autenticación
    }

    // Intenta borrar la autenticación del usuario
    try {
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            password
        )

        const result = await reauthenticateWithCredential(
            auth.currentUser,
            credential
        )

        await deleteUser(result.user);
        console.log(`User ${uid} deleted from auth!`);
    } catch (error) {
        console.error(`Error deleting user from auth: ${error}`);
        // Si falla, intenta restaurar el documento en la base de datos
        try {
            await setDoc(userDocRef, userData);
            console.log(`User ${uid} restored in database!`);
        } catch (restoreError) {
            console.error(`Error restoring user in database: ${restoreError}`);
        }
    }
}
