import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbAddInvoice = (data, user) => {
  if(!user || !user.businessID) return
    const billsRef = doc(db, 'businesses', user.businessID, "invoices", data.id)
    try {
      setDoc(billsRef, {
        data: {
          ...data,
          date: new Date(),
        }
      });
    } catch (error) {
      console.log(error)
    }
  }