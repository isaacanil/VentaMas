
/**
 * Guarda una preorden en Firestore.
 * @param {Object} user - Información del usuario.
 * @param {Object} cartData - Datos del carrito de compras.
 * @returns {Promise} - Promesa que resuelve con los datos de la preorden guardada.
 */

import { collection, doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { nanoid } from "nanoid";
import { getNextID } from "../Tools/getNextID";
import { db } from "../firebaseconfig";

export const fbAddPreOrder = async (user, cartData) => {
    try {
        const data = {
            ...cartData,
            id: nanoid(),
            date: null,
            status: "pending",
            type: "preorder",
            preorderDetails: {
                date: serverTimestamp(),
                isOrWasPreorder: true,
                numberID: await getNextID(user, "preorder"),
                userID: user.uid,
                paymentStatus: "unpaid",
            },
            history: [{
                type: "preorder",
                status: "pending",
                date: Timestamp.now(),
                userID: user.uid
            }]
        }
        const invoiceRef = doc(db, `businesses/${user.businessID}/invoices/${data.id}`);
       
      
        const docRef = await setDoc(invoiceRef, {data});
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
};