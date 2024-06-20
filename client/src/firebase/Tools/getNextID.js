import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbGetDoc, fbSetDoc, fbUpdateDoc } from "../firebaseOperations";

export async function getNextID(user, name, transaction = null) {
    try {
        if (!name) throw new Error("No name provided");
        if (!user || !user.businessID) throw new Error("No user or businessID provided");

        const counterRef = doc(db, "businesses", user.businessID, 'counters', name);

        // Obtener el documento
        const counterSnap = await fbGetDoc(counterRef, transaction);

        let nextID;
        if (counterSnap.exists()) {
            // Si el documento existe, incrementar el valor 
            await fbUpdateDoc(counterRef, { value: increment(1) });
            nextID = counterSnap.data().value + 1;
            if (!nextID) throw new Error("Error al obtener el siguiente ID: value is null");
        } else {
            // Si el documento no existe, crearlo con el valor inicial
            nextID = 1;
            await fbSetDoc(counterRef, { value: nextID }, transaction);
        }
        return nextID;

    } catch (error) {
        console.error("Error al obtener el siguiente ID:", error);
        throw new Error("Error al obtener el siguiente ID:" + error.message);
    }
}
