import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { db } from "../firebaseconfig";
import { selectUser } from "../../features/auth/userSlice";

/**
 * Subscribe to Firestore document changes with automatic error handling.
 *
 * @param {string} businessId - The business ID associated with the document.
 * @param {string} docId - The document ID to subscribe to.
 * @param {Function} onChange - Callback function to handle data changes.
 * @param {Function} onError - Callback function to handle errors.
 * @returns {Function} - Unsubscribe function to call on component unmount.
 */
const subscribeToCashCount = (businessId, docId, onChange, onError) => {
    const cashCountRef = doc(db, 'businesses', businessId, "cashCounts", docId);
    return onSnapshot(cashCountRef, (snapshot) => {
        if (snapshot.exists()) {
            onChange(snapshot.data());
        } else {
            onChange(null); // Handle case where no data is available
        }
    }, onError);
};

/**
 * Custom React hook to fetch and subscribe to the cash count from Firestore.
 *
 * @param {string} id - The document ID to fetch.
 * @returns {Object|null} - The cash count data or null if not available.
 */
export const useFbGetCashCount = (id) => {
    const [cashCount, setCashCount] = useState(null);
    const user = useSelector(selectUser);
    
    useEffect(() => {
        if (!id || !user?.businessID) {
            setCashCount(null);
            return;
        }

        const onError = (error) => {
            console.error("Error fetching cash count:", error);
            setCashCount(null);
        };

        const unsubscribe = subscribeToCashCount(
            user.businessID, 
            id, 
            setCashCount, 
            onError
        );

        return unsubscribe;
    }, [id, user?.businessID]);

    return cashCount;
};
