import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../features/auth/userSlice";
import { subscribeToPurchase, processPurchase, getProvider } from "../firebase/purchase/fbGetPurchases";
import { sortPurchases } from '../utils/filterUtils';
import { subscribeSinglePurchase } from "../firebase/purchase/fbGetPurchase";
import { selectPurchaseList, updatePurchases } from "../features/purchase/purchasesSlice";

// Función auxiliar para convertir timestamps
const convertTimestamps = (data) => {
    if (!data) return data;
    
    const timestampFields = ['createdAt', 'updatedAt', 'deliveryAt', 'paymentAt', 'completedAt', 'expirationDate'];
    
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => convertTimestamps(item));
    }
    
    // Handle objects
    if (typeof data === 'object') {
        const converted = { ...data };
        
        // Convert direct timestamp fields
        timestampFields.forEach(field => {
            if (converted[field] && typeof converted[field].toMillis === 'function') {
                converted[field] = converted[field].toMillis();
            }
        });
        
        // Recursively convert nested objects/arrays
        Object.keys(converted).forEach(key => {
            if (typeof converted[key] === 'object' && converted[key] !== null) {
                converted[key] = convertTimestamps(converted[key]);
            }
        });
        
        return converted;
    }
    
    return data;
};
export const useListenPurchases = (filterState) => {
    const dispatch = useDispatch();
    const purchases = useSelector(selectPurchaseList);
    const user = useSelector(selectUser);
    const setPurchases = (purchase) => dispatch(updatePurchases(purchase))
    const [isLoading, setIsLoading] = useState(false);

    const sortedPurchases = useMemo(() => {
        if (!purchases) return [];
        return filterState?.isAscending !== undefined 
            ? sortPurchases(purchases, filterState.isAscending)
            : purchases;
    }, [purchases, filterState?.isAscending]);

    useEffect(() => {
        if (!user?.businessID) return;
        
        setIsLoading(true);
        
        const unsubscribe = subscribeToPurchase(
            user.businessID, 
            filterState?.filters,
            async (snapshot) => {
                try {
                    const purchases = await Promise.all(
                        snapshot.docs.map(async (doc) => {
                            const purchaseData = doc.data(); 
                            // Convertir timestamps
                            const processedData = convertTimestamps(purchaseData);
                            return processPurchase(processedData, user.businessID);
                        })
                    );

                    setPurchases(purchases);
                } catch (error) {
                    console.error("Error fetching purchases:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            unsubscribe();
            setIsLoading(false);
        };
    }, [user, filterState.filters]);

    return { 
        purchases: sortedPurchases,
        isLoading 
    };
};

export const useListenPurchase = (purchaseId) => {
    const [purchase, setPurchase] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const user = useSelector(selectUser);

    useEffect(() => {
        if (!user?.businessID || !purchaseId) return;
        
        setIsLoading(true);
        
        const unsubscribe = subscribeSinglePurchase(
            user.businessID,
            purchaseId,
            async (snapshot) => {
                try {
                    if (!snapshot.exists()) {
                        setPurchase(null);
                        return;
                    }

                    const purchaseData = snapshot.data(); 
                    const processedData = convertTimestamps(purchaseData);

                    setPurchase(processedData);
                } catch (error) {
                    console.error("Error fetching single purchase:", error);
                    setPurchase(null);
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            unsubscribe();
            setIsLoading(false);
        };
    }, [user, purchaseId]);

    return { 
        purchase,
        isLoading 
    };
};
