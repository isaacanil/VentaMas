import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../firebaseconfig";

// Function to get the last installment amount for a specific AR ID
export const getLastInstallmentAmountByArId = async (user, arId) => {
    try {
        const installmentsRef = collection(db, 'businesses', user.businessID, 'accountsReceivableInstallments');
        const q = query(installmentsRef, where('arId', '==', arId), orderBy('installmentDate', 'asc'));
        const querySnapshot = await getDocs(q);

        const installments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (installments.length === 0) {
            console.log('No installments found for the specified AR ID.');
            return null;
        }

        const lastInstallment = installments[installments.length - 1];
        return lastInstallment.installmentAmount;
    } catch (error) {
        console.error("Error getting last installment amount by AR ID:", error);
        throw error;
    }
};
