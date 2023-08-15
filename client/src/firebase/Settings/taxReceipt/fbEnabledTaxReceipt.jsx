import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import { useDispatch } from "react-redux";
import { toggleTaxReceiptSettings } from "../../../features/taxReceipt/taxReceiptSlice";

export const fbEnabledTaxReceipt = async (user) => {
    if (!user || !user?.businessID) return;

    try {
        const settingRef = doc(db, 'businesses', user.businessID, 'settings', 'taxReceipt');
        const docSnap = await getDoc(settingRef);
        if (docSnap.exists()) {
            const currentValue = docSnap.data().taxReceiptEnabled;
            await updateDoc(settingRef, { taxReceiptEnabled: !currentValue });
        } else {
            await setDoc(settingRef, { taxReceiptEnabled: true });
        }
    } catch (error) {
        console.error("Ocurrió un error al actualizar el comprobante fiscal:", error);
        // Puedes manejar el error de la forma que consideres adecuada, como mostrar un mensaje al usuario.
    }
}
