import { useEffect, useState } from "react";

import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { selectUser } from "../../features/auth/userSlice";
import { useSelector } from "react-redux";

export const fbGetPendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const user = useSelector(selectUser)
    useEffect(() => {
        if (!user || !user.businessID) return;
        const pendingOrdersRef = collection(db, 'businesses', user.businessID, 'orders');
        const fetchData = async () => {
            const unsubscribe = onSnapshot(pendingOrdersRef, (snapshot) => {
                const pendingOrders = snapshot.docs.map(doc => doc.data());
                setPendingOrders(pendingOrders);
            })
            return unsubscribe;
        }
        fetchData();
    }, [user])
    console.log(pendingOrders)
    return { pendingOrders };
}