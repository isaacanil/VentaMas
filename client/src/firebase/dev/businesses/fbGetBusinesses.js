import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../../firebaseconfig"

export const fbGetBusinesses = async (setBusinesses) => {
    const businessesRef = collection(db, "businesses")

    onSnapshot(businessesRef, (snapshot) => {
        const businesses = snapshot.docs.map((doc) => doc.data())
        setBusinesses(businesses)
    })
}
