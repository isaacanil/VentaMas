
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { nanoid } from 'nanoid';

export const fbRecordError = async (user, errorStackTrace, errorInfo) => {
    try {
        if(errorStackTrace === null || errorInfo === null) return
        if(!user) return
        const errorId = nanoid(12);
        const errorRef = doc(db, "errors", errorId);
        const error = {
            user: user.uid,
            business: user.businessID,
            id: errorId,
            createdAt: new Date(),
            status: "pending",
            errorStackTrace,
            errorInfo
        }
        // Agrega un nuevo documento en la colección "errors" con la fecha, la pila de errores y el stack de componentes
        await setDoc(errorRef, error );
        console.log("Error registrado en Firebase con éxito");
    } catch (e) {
        console.error("Error añadiendo documento: ", e);
    }
}