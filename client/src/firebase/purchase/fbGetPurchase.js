import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbGetDocFromReference } from "../provider/fbGetProviderFromReference";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectPurchaseList, updatePurchases } from "../../features/purchase/purchasesSlice";
import { selectUser } from "../../features/auth/userSlice";
import { orderBy } from "lodash";
import { DateTime } from "luxon";

export const useFbGetPurchase = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const purchases = useSelector(selectPurchaseList);
    const setPurchases = (purchase) => {
        dispatch(updatePurchases(purchase))
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!user.businessID || purchases.length > 0) return;

            const purchasesRef = collection(db, 'businesses', user?.businessID, 'purchases');
            
            const q = query(purchasesRef, orderBy("data.numberId", "desc"));
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                try {
                    const purchasePromises = snapshot.docs.map(async (item) => {
                        let purchaseData = item.data();
                        // Fetch provider data
                        try {
                            const providerDoc = await fbGetDocFromReference(purchaseData.data.provider);
                            if (providerDoc) { 
                                purchaseData.data.provider = providerDoc.provider;
                            }
                        } catch (error) {
                            console.error('Error fetching provider data:', error);
                            // Handle error or set a default value
                        }
                        
                        // Convert Firestore timestamps to JavaScript Date objects
                        ['createdAt', 'deliveryDate', 'paymentDate', 'updatedAt'].forEach(dateField => {
                            if (purchaseData.data.dates[dateField]) {
                                purchaseData.data.dates[dateField] = purchaseData.data.dates[dateField].toDate().getTime() || DateTime.now().toMillis();
                            }
                        });

                        return purchaseData;
                    });

                    const purchaseArray = await Promise.all(purchasePromises);
                    setPurchases(purchaseArray);
                } catch (error) {
                    console.error('Error fetching purchase data:', error);
                    // Handle the error appropriately, like setting an error state
                }
            });

            return () => unsubscribe();
        };
        fetchData();
    }, [user, purchases.length]); // Added purchases.length to dependencies

    return { purchases };
}
