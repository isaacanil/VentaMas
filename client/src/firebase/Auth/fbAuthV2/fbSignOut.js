import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import { useDispatch } from "react-redux";
import { logout } from "../../../features/auth/userSlice";

export const fbSignOut = async () => {
    // Nota: Asegúrate de importar 'db' desde tu archivo de configuración de Firebase.
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
        await deleteDoc(doc(db, 'sessionTokens', sessionToken));
    }

    // Clear session token from local storage
    localStorage.removeItem('sessionToken');

    console.log('User logged out successfully');
};