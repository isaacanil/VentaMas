import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { setBusiness } from "../../features/auth/businessSlice"

export const fbGetBusinessInfo = (user, dispatch) => {
    if (!user || !user.businessID) { return }
    console.log('user', user, user.businessID, "businesses")
    const businessInfoRef = doc(db, "businesses", user.businessID)
    const unsubscribe = onSnapshot(businessInfoRef, (doc) => {
        if (doc.exists) {
            const { business } = doc.data()
            dispatch(setBusiness(business))
        } else {
            console.log('documento no encontrado')
        }
    })
    return unsubscribe
}
