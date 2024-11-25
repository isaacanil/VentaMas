import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbCashCountStatus = async (user, cashCountID, state) => {
    const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCountID);
    const cashCountDoc = await getDoc(cashCountRef);

    if (cashCountDoc.exists() && cashCountID && state) {
        const cashCountData = cashCountDoc.data();
        const isStateMatch = cashCountData.cashCount.state === state;
        
        return isStateMatch;
    }
    return false; 
}
