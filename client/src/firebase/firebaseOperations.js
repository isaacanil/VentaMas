import { getDocs, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

// Función para leer datos de Firestore
export async function fbGetDocs(refOrQuery, transaction = null) {
    try {

        return transaction ? await transaction.get(refOrQuery) : await getDocs(refOrQuery);
    } catch (error) {
        console.error("Error al leer datos de Firestore: ", error);
        throw error;
    }
}

export async function fbGetDoc(refOrQuery, transaction = null) {
    try {
        return transaction ? await transaction.get(refOrQuery) : await getDoc(refOrQuery);
    } catch (error) {
        console.error("Error al leer datos de Firestore: ", error);
        throw error;
    }
}


// Función para escribir datos en Firestore
export async function fbSetDoc(ref, data, transaction = null) {
    try {
        return transaction ? await transaction.set(ref, data) : await setDoc(ref, data);
    } catch (error) {
        console.error("Error al escribir datos en Firestore: ", error);
        throw error;
    }
}

// Función para actualizar datos en Firestore
export async function fbUpdateDoc(ref, data, transaction = null) {
    try {
        return transaction ? await transaction.update(ref, data) : await updateDoc(ref, data);
    } catch (error) {
        console.error("Error al actualizar datos en Firestore: ", error);
        throw error;
    }
}

// Función para eliminar datos de Firestore
export async function fbDeleteDoc(ref, transaction = null) {
    try {
        return transaction ? await transaction.delete(ref) : await deleteDoc(ref);
    } catch (error) {
        console.error("Error al eliminar datos de Firestore: ", error);
        throw error;
    }
}

export default { fbGetDocs, fbGetDoc, fbSetDoc, fbUpdateDoc, fbDeleteDoc }