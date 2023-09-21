import { useEffect, useState } from "react";

import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { selectUser } from "../../features/auth/userSlice";
import { useSelector } from "react-redux";
import { fbGetDocFromReference } from "../provider/fbGetProviderFromReference";
import { DateTime } from "luxon";

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
                    // .filter(order => order.data.state === 'state_2')
                    .sort((a, b) => b.data.numberId - a.data.numberId)
                    .map(async (doc) => {
                        const ordersDocs = doc;
                        const providerDoc = await fbGetDocFromReference(doc.data.provider);
                       
                        if (providerDoc) {
                            ordersDocs.data.provider = providerDoc.provider;
                        }
                        // Convertir las marcas de tiempo de Firebase a milisegundos
                        // Convertir los segundos a milisegundos y usar Luxon para manipular la fecha
                        if (ordersDocs.data.dates.deliveryDate) {
                            const deliveryDateMillis = ordersDocs.data.dates.deliveryDate.seconds * 1000;
                            ordersDocs.data.dates.deliveryDate = deliveryDateMillis;
                        }

                        if (ordersDocs.data.dates.createdAt) {
                            const createdAtMillis = ordersDocs.data.dates.createdAt.seconds * 1000;
                            ordersDocs.data.dates.createdAt = createdAtMillis;
                        }
                        if (ordersDocs.data.dates.updatedAt) {
                            const updatedAtMillis = ordersDocs.data.dates.updatedAt.seconds * 1000;
                            ordersDocs.data.dates.updatedAt = updatedAtMillis;
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