import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebaseconfig";

// Function to get the last installment amount for a specific AR ID
export const getLastInstallmentAmountByArId = async (user, arId) => {
    try {
        const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
        const q = query(installmentsRef, where('arId', '==', arId), where('isActive', '==', true), orderBy('installmentDate', 'asc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        const lastInstallment = querySnapshot.docs[0].data();
        return lastInstallment?.installmentBalance;
    } catch (error) {
        console.error("Error getting last installment amount by AR ID:", error);
        throw error;
    }
};
