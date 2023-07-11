import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbGetBusinessInfo = (setBusinessInfo, user) => {
    if(!user || !user.businessID){return}
    console.log('user', user, user.businessID, "businesses")
    const businessInfoRef = doc(db, "businesses", user.businessID)
   const unsubscribe = onSnapshot(businessInfoRef, (doc)=>{
    if(doc.exists){
        const {business} = doc.data()
        setBusinessInfo(business)
    }else
    {
        console.log('documento no encontrado')
    }
   })
   return unsubscribe
}