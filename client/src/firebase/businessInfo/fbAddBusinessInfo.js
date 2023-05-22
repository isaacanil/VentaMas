import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbUpdateBusinessInfo = (businessInfo, user) => {
    if(!user || !user.businessID){return}
    const businessInfoRef = doc(db, "businesses", user.businessID)
    updateDoc(businessInfoRef, {business: {...businessInfo}})
}