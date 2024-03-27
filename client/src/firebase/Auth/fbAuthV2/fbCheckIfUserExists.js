import { doc, setDoc, getDocs, query, collection, where, Timestamp } from "firebase/firestore";
import { db } from "../../firebaseconfig";


// Función para verificar si el nombre de usuario ya existe
export async function fbCheckIfUserExists(name) {
    const userCollection = collection(db, "users");
    const nameQuery = query(userCollection, where("user.name", "==", name));
    const matchingUsersSnapshot = await getDocs(nameQuery);

    return !matchingUsersSnapshot.empty;
}