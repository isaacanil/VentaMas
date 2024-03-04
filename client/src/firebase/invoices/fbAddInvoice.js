import { Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddBillToOpenCashCount } from "../cashCount/fbAddBillToOpenCashCount";
import { nanoid } from "nanoid";
import { getNextID } from "../Tools/getNextID";

export const fbAddInvoice = async (data, user) => {
  if (!user || !user.businessID) return

  try {
    const userRef = doc(db, "users", user.uid);
    const nextNumberId = await getNextID(user, 'lastInvoiceId');
    let bill = {
      ...data,
      id: nanoid(12),
      date: Timestamp.now(),
      numberID: nextNumberId,
      userID: user.uid,
      user: userRef
    }
    const billRef = doc(db, 'businesses', user.businessID, "invoices", bill.id)
    setDoc(billRef, { data: bill });
    fbAddBillToOpenCashCount(user, billRef)
  } catch (error) {
    console.log(error)
  }
}