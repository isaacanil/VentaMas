import { getDocs, query, collection, where } from "firebase/firestore";

import { db } from "../../firebaseconfig";


// Función para verificar si el nombre de usuario ya existe
export async function fbCheckIfUserExists(name, excludeId = null) {
    const userCollection = collection(db, "users");
    const nameQuery = query(userCollection, where("user.name", "==", name));
    const matchingUsersSnapshot = await getDocs(nameQuery);

    // Si no hay usuarios con ese nombre, retornar false
    if (matchingUsersSnapshot.empty) {
        return false;
    }

    // Si se proporciona excludeId, verificar si todos los usuarios encontrados tienen ese ID
    if (excludeId) {
        // Verificar si algún usuario encontrado tiene un ID diferente al excludeId
        const hasOtherUser = matchingUsersSnapshot.docs.some(doc => doc.id !== excludeId);
        return hasOtherUser;
    }

    // Si no se proporciona excludeId, retornar true si hay algún usuario con ese nombre
    return true;
}