import { Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddBillToOpenCashCount } from "../cashCount/fbAddBillToOpenCashCount";
import { nanoid } from "nanoid";
import { getNextID } from "../Tools/getNextID";
import { fbSetDoc } from "../firebaseOperations";

export const fbAddInvoice = async (data, user, transaction = null) => {
  if (!user || !user.businessID) return

  try {
    const userRef = doc(db, "users", user.uid);
    const nextNumberId = await getNextID(user, 'lastInvoiceId', transaction);
    let bill = {
      ...data,
      id: data?.id || nanoid(),
      date: Timestamp.now(),
      numberID: nextNumberId,
      userID: user.uid,
      user: userRef
    }
    const billRef = doc(db, 'businesses', user.businessID, "invoices", bill.id)

    await fbSetDoc(billRef, { data: bill }, transaction)
    await fbAddBillToOpenCashCount(user, billRef, transaction)
  } catch (error) {
    console.log(error)
  }
}