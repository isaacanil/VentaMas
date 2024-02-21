import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbCashCountStatus = async (user, cashCountID, state) => {
    const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCountID);
    const cashCountDoc = await getDoc(cashCountRef);

    if (cashCountDoc.exists() && cashCountID && state) {
        const cashCountData = cashCountDoc.data();
        // Verifica si el estado del cuadre de caja coincide con el estado especificado
        const isStateMatch = cashCountData.cashCount.state === state;
        console.log(isStateMatch, " --> isStateMatch")
        
        return isStateMatch;
    }
    return false; // Devuelve false si el documento no existe o si no hay coincidencia
}
