import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { useCallback, useState, useEffect } from "react";

export function fbGetPendingBalance(businessID, clientId, callback) {
    const safeCb = typeof callback === 'function' ? callback : () => {}; // Define safeCb at the beginning

    if (!businessID || !clientId) {
        safeCb(0); // Use safeCb here
        return () => { };
    }

    const accountsReceivableRef = collection(db, `businesses/${businessID}/accountsReceivable`);
    const q = query(accountsReceivableRef, where('clientId', '==', clientId));

    try {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                safeCb(0);
                return;
            }
            //
            let totalPendingBalance = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                totalPendingBalance += Number(data.arBalance) || 0;
            });

            safeCb(totalPendingBalance);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error getting documents: ', error);
        safeCb(0);
        return () => { };
    }
}

function usePendingBalance(businessID, clientId, onBalanceChange = null) {
    const [pendingBalance, setPendingBalance] = useState(0);



    useEffect(() => {
        if (!businessID || !clientId) {
            setPendingBalance(0);
            if (onBalanceChange) onBalanceChange(0);
            return;
        }

        const unsubscribe = fbGetPendingBalance(businessID, clientId, onBalanceChange);
        return () => unsubscribe();
    }, [businessID, clientId]);

    return pendingBalance;
}

export function useGetPendingBalance({ dependencies = [], onBalanceChange = null }) {
    const [pendingBalance, setPendingBalance] = useState(0);

    const updateBalance = useCallback((balance) => {
        setPendingBalance(balance);
        if (onBalanceChange) {
            onBalanceChange(balance);

        }
    }, [onBalanceChange]);

    useEffect(() => {
        const unsubscribe = fbGetPendingBalance(...dependencies, updateBalance);
        return () => unsubscribe();
    }, [dependencies, updateBalance]);

    return pendingBalance;
}

export { usePendingBalance };
