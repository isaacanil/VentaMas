import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { validateUser } from "../../utils/userValidation"

export const fbUpdateTaxReceipt = async (taxReceipts, user) => {
   
    taxReceipts.map(({data}) => {
        try {
            console.log(data, " --> data")
            const { businessID } = user
            const taxReceiptRef = doc(db, "businesses", businessID, "taxReceipts", data.id)
            updateDoc(taxReceiptRef, {data})
            console.log('listo, todo bien')
        } catch (err) {
            console.log(err)
        }
    })
}