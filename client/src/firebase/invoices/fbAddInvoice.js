import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbAddBillToOpenCashCount } from "../cashCount/fbAddBillToOpenCashCount";

export const fbAddInvoice = (data, user) => {
  if(!user || !user.businessID) return

    const billRef = doc(db, 'businesses', user.businessID, "invoices", data.id)
    
    try {
      setDoc(billRef, {
        data: {
          ...data,
          date: new Date(),
        }
      });
      fbAddBillToOpenCashCount(user, billRef )
    } catch (error) {
      console.log(error)
    }
  }