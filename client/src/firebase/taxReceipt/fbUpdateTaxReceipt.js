import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { validateUser } from "../../utils/userValidation"

export const fbUpdateTaxReceipt = async (user, taxReceipts) => {
    if (!user || !user?.businessID) return;
    taxReceipts.map(({ data }) => {
        try {
            console.log(data, " --> data")
            const taxReceiptRef = doc(db, "businesses", user?.businessID, "taxReceipts", data.id)
            updateDoc(taxReceiptRef, { data })
            console.log('listo, todo bien')
        } catch (err) {
            console.log(err)
        }
    })
}