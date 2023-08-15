import { collection, getDoc, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"

export const useFbGetOrders = () => {
    const [orders, setOrders] = useState([])
    const user = useSelector(selectUser);
    useEffect(() => {
        if (!user || !user.businessID) return
        const orderRef = collection(db, "businesses", user.businessID, "orders")
        // const q = query(orderRef, where("data.state.name", "==", "Solicitado"))
        const unsubscribe = onSnapshot(orderRef, (snapshot) => {
            let orderArray = snapshot.docs.map(async (item) => {
                let orderData = item.data()
                let providerRef = orderData.data.provider;
                let providerDoc = (await getDoc(providerRef)).data()
                orderData.data.provider = providerDoc.provider
                return orderData
            })
            Promise.all(orderArray).then(result => {
                setOrders(result)
            }).catch(error => {
                console.log(error)
            });
            setOrders(orderArray)
        })
        return () => unsubscribe()
    }, [user])
    console.log(orders, 'orders-------------------------------------------------')
    
    return { orders }
}