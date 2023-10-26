import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbGetDocFromReference } from "../provider/fbGetProviderFromReference";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectPurchaseList, updatePurchases } from "../../features/Purchase/purchasesSlice";
import { selectUser } from "../../features/auth/userSlice";

export const useFbGetPurchase =  () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const purchases = useSelector(selectPurchaseList);
    const setPurchases = (purchase) => {
        dispatch(updatePurchases(purchase))
      }
    useEffect(() => {
        const fetchData = () => {
            if (!user.businessID || purchases.length > 0) return;
            const purchasesRef = collection(db, 'businesses', user?.businessID, 'purchases')
            const unsubscribe = onSnapshot(purchasesRef, async (snapshot) => {
                const purchasePromises = snapshot.docs
                    .map((item) => item.data())
                    .sort((a, b) => a.data.id - b.data.id)
                    .map(async (item) => {
                        let purchaseData = item;
                        const providerDoc = await fbGetDocFromReference(purchaseData.data.provider)

                        if (providerDoc) { // Asegúrate de que providerDoc esté definido
                            purchaseData.data.provider = providerDoc.provider;
                        }
                        if (purchaseData.data.dates.createdAt) {
                            purchaseData.data.dates.createdAt = purchaseData.data.dates.createdAt.toDate().getTime()
                        }
                        if (purchaseData.data.dates.deliveryDate) {
                            purchaseData.data.dates.deliveryDate = purchaseData.data.dates.deliveryDate.toDate().getTime()
                        }
                        if (purchaseData.data.dates.paymentDate) {
                            purchaseData.data.dates.paymentDate = purchaseData.data.dates.paymentDate.toDate().getTime()
                        }
                        if (purchaseData.data.dates.updatedAt) {
                            purchaseData.data.dates.updatedAt = purchaseData.data.dates.updatedAt.toDate().getTime()
                        }
                        return purchaseData;
                    })

                const purchaseArray = await Promise.all(purchasePromises);
                setPurchases(purchaseArray);
                console.log(purchaseArray);
            })
            return () => unsubscribe();
        }
        fetchData();
    }, [user])
    return { purchases };
}