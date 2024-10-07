import { arrayUnion, doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { getNextID } from "../Tools/getNextID";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";

export async function fbGenerateInvoiceFromPreorder(user, preorder) {
    try {
        if (!preorder?.preorderDetails?.isOrWasPreorder) {
            throw new Error("Preorder details are missing or invalid.");
        }
        const userRef = doc(db, "users", user?.uid);
        const nextNumberId = await getNextID(user, 'lastInvoiceId');
        const historyEntry = {
            type: "invoice",
            status: "completed",
            date: Timestamp.now(),  // Se utiliza serverTimestamp para obtener la fecha y hora del servidor
            userID: user.uid
        };
        const bill = {
            ...preorder,
            status: 'completed',
            date: serverTimestamp(),
            numberID: nextNumberId,
            userID: user.uid,
            user: userRef,
            history: arrayUnion(historyEntry)
        }

        const billDocRef = doc(db, 'businesses', user?.businessID, 'invoices', bill?.id)
        await updateDoc(billDocRef, { data: bill })
        return bill
    } catch (error) {
        console.error('Error al generar la factura:', error)
    }
}