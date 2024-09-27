import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebaseconfig";

// Function to get preorders from Firebase
export async function fbGetPreorders(user, callback) {
    try {
        const preordersCollection = collection(db, "businesses", user.businessID, "invoices");
        const q = query(preordersCollection,where("data.status", "==", "pending"), where("data.preorderDetails.isOrWasPreorder", "==", true), orderBy("data.preorderDetails.date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const preordersList = snapshot.docs.map(doc => doc.data());
            callback(preordersList);
        })

        // Retorna la función para desuscribirse del listener
        return unsubscribe;
    } catch (error) {
        console.error("Error fetching preorders: ", error);
        return () => {}; 
    }
}