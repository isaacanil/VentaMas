import { useSelector } from "react-redux"
import { validateUser } from "../../utils/userValidation"
import { selectUser } from "../../features/auth/userSlice"
import { doc, setDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { nanoid } from "nanoid"

export const fbCreateTaxReceipt = async (taxReceipt, user) => {

  taxReceipt = {
    ...taxReceipt,
    id: nanoid(8)
  }

  try {
    validateUser(user)
    const { businessID } = user
    const taxReceiptRef = doc(db, "businesses", businessID, "taxReceipts", taxReceipt.id)
    await setDoc(taxReceiptRef, { data: taxReceipt })
    console.log(taxReceiptRef)
  } catch (err) {
    console.log(err)
  }
}