import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../firebaseconfig';

export function fbGetCreditLimit({ user, clientId }) {
    return new Promise((resolve, reject) => {
        if (!user?.businessID || !clientId) {
            reject(new Error("BusinessID o ClientID no proporcionados"));
            return;
        }

        const creditLimitRef = doc(db, 'businesses', user.businessID, 'creditLimit', clientId);

        const unsubscribe = onSnapshot(creditLimitRef, 
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    resolve(docSnapshot.data());
                } else {
                    resolve(null);
                    console.log('No existe tal documento!');
                }
            },
            (error) => {
                reject(error);
            }
        );

        // Retorna la función para cancelar la suscripción
        return unsubscribe;
    });
}
