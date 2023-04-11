import { collection, onSnapshot } from "firebase/firestore"
import { toggleLoader } from "../../features/loader/loaderSlice"
import { db } from "../firebaseconfig"
/* */
export const fbGetProductOutflow = ({setOutflowList, setOutflowListLoader, dispatch}) => {
    const productOutflowRef = collection(db, 'productOutflow')
    setOutflowListLoader(true)
    onSnapshot(productOutflowRef, (snapshot) => {
        if(snapshot.empty) {
            setOutflowList([])
            setOutflowListLoader(false)
            return
        }
        const productOutflowArray = snapshot.docs.map(doc => doc.data())
        setOutflowList(productOutflowArray)
        setTimeout(() => {
            setOutflowListLoader(false)
        }, 1000)
   
    })
}