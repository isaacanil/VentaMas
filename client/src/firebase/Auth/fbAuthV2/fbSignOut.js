import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import { useDispatch } from "react-redux";
import { logout } from "../../../features/auth/userSlice";

export const fbSignOut = async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (sessionToken) {
        await deleteDoc(doc(db, 'sessionTokens', sessionToken));
    }

    localStorage.removeItem('sessionToken');
};