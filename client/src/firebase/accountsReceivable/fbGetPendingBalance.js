import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseconfig";


export async function fbGetPendingBalance(businessID, clientId) {
    const accountsReceivableRef = collection(db, `businesses/${businessID}/accountsReceivable`);

    const q = query(
        accountsReceivableRef,
        where('clientId', '==', clientId),
    );

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('No matching documents.');
            return 0; 
        }

        let totalPendingBalance = 0;
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            totalPendingBalance += data.arBalance;
        });
     
        return totalPendingBalance

    } catch (error) {
        console.error('Error getting documents: ', error);
        throw new Error('Error getting documents');
    }
}