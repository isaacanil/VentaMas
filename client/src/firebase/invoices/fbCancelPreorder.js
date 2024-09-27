import { arrayUnion, doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { getNextID } from "../Tools/getNextID";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";

export async function fbCancelPreorder(user, preorder) {
    try {
        if (!preorder?.preorderDetails?.isOrWasPreorder || !preorder?.status == "pending") {
            throw new Error("Preorder details are missing or invalid.");
        }
       
        const historyEntry = {
            type: "preorder",
            status: "cancelled",
            date: Timestamp.now(),  // Se utiliza serverTimestamp para obtener la fecha y hora del servidor
            userID: user.uid
        };

        const bill = {
            ...preorder,
            status: 'cancelled',
            date: serverTimestamp(),
            userID: user.uid,
            history: arrayUnion(historyEntry),
            cancel: {
                reason: 'cancelled',
                user: user.uid,
                cancelledAt: serverTimestamp()
            }
        }

        const billDocRef = doc(db, 'businesses', user?.businessID, 'invoices', bill?.id)
        await updateDoc(billDocRef, { data: bill })
        return bill
    } catch (error) {
        console.error('Error al generar la factura:', error)
    }
}