import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../../../../firebase/firebaseconfig";

export async function fbGetStructureData(ref) {
    try {
        const Ref = collection(db, ref)
        const q = query(Ref, limit(1))
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => doc.data())
    } catch (error) {
        console.log(error)
    }
}