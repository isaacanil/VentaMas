import { Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddBillToOpenCashCount } from "../cashCount/fbAddBillToOpenCashCount";
import { nanoid } from "nanoid";

export const fbAddInvoice = (data, user) => {
  if(!user || !user.businessID) return
    let bill = {
      ...data,
      id: nanoid(12),
      date: Timestamp.now(),
    }
    const billRef = doc(db, 'businesses', user.businessID, "invoices", bill.id)
    
    try {
      setDoc(billRef, {data: bill});
      fbAddBillToOpenCashCount(user, billRef )
    } catch (error) {
      console.log(error)
    }
  }