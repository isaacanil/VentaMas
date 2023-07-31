import { collection, onSnapshot } from "firebase/firestore"
import { toggleLoader } from "../../features/loader/loaderSlice"
import { db } from "../firebaseconfig"
/* */
export const fbGetProductOutflow = ({user, setOutflowList, setOutflowListLoader, dispatch}) => {
    if(!user?.businessID) return
    console.log('fbGetProductOutflow', user.businessID, '-------------------')
   
    const productOutflowRef = collection(db,"businesses", user.businessID, 'productOutflow')
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
   
    } , error => {
        // maneja el error aquí
        console.error("Error al leer de Firestore: ", error);
    })
}