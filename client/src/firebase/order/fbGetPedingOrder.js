import { useEffect, useState } from "react";

import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { selectUser } from "../../features/auth/userSlice";
import { useSelector } from "react-redux";
import { fbGetDocFromReference } from "../provider/fbGetProviderFromReference";

export const fbGetPendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const user = useSelector(selectUser)
    useEffect(() => {
        if (!user || !user.businessID) return;
        const pendingOrdersRef = collection(db, 'businesses', user.businessID, 'orders');
        const fetchData = async () => {
            const unsubscribe = onSnapshot(pendingOrdersRef, async (snapshot) => {
                let pendingOrdersPromise = snapshot.docs
                .map(doc => doc.data())
                .filter(order => order.data.state === 'state_2')
                .sort((a, b) => b.data.id - a.data.id)
                .map(async (doc) => {
                    const ordersDocs = doc;
                    const providerDoc = await fbGetDocFromReference(ordersDocs.data.provider);
                    if(providerDoc) {
                        ordersDocs.data.provider = providerDoc.provider;
                    }
                    return ordersDocs;
                });
                const pendingOrders = await Promise.all(pendingOrdersPromise);
                setPendingOrders(pendingOrders);
            })
            return unsubscribe;
        }
        fetchData();
    }, [user])
    console.log(pendingOrders)
    return { pendingOrders };
}