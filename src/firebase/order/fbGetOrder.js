import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebaseconfig";

export const subscribeSingleOrder = (businessID, orderId, callback) => {
    const docRef = doc(db, 'businesses', businessID, 'orders', orderId);
    return onSnapshot(docRef, callback);
};
