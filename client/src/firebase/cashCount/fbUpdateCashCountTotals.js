import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export async function fbUpdateCashCountTotals(user, cashCountId, cashCount) {
    if (!user || !user?.businessID) { return }
    try {
        const cashCountRef = doc(db, "businesses", user.businessID, "cashCounts", cashCountId); 
        await updateDoc(cashCountRef, {
            'cashCount.totalCard': cashCount?.totalCard,
            'cashCount.totalTransfer': cashCount?.totalTransfer,
            'cashCount.totalCharged': cashCount?.totalCharged,
            'cashCount.totalDiscrepancy': cashCount?.totalDiscrepancy,
            'cashCount.totalRegister': cashCount?.totalRegister,
            'cashCount.totalSystem': cashCount?.totalSystem
        });
    } catch (error) {
        console.error("Error al actualizar el documento:", error);
    }
}

