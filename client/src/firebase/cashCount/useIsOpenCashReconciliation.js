import { collection, doc, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { useEffect, useState } from "react";
import { selectUser } from "../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";

export function useIsOpenCashReconciliation(getData) {
    const [value, setValue] = useState(false);
    const [cashReconciliation, setCashReconciliation] = useState(null);
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!user || !user?.businessID) { return }
        const cashReconciliationRef = collection(db, 'businesses', user?.businessID, 'cashCounts');
        const q = query(cashReconciliationRef, where("cashCount.state", "in", ["open", "closing"]));

        const unsubscribe = onSnapshot(q, querySnapshot => {
            const isOpen = querySnapshot.docs.some(doc => doc.data().cashCount.state === 'open');
           
            const isClosing = querySnapshot.docs.some(doc => doc.data().cashCount.state === 'closing');
            if (isOpen) {
                setValue('open');
                const data = q.docs.map(doc => doc.data());
                if(getData){

                    setCashReconciliation(getData);
                }
            } else if (isClosing) {
                setValue('closing');
            } else {
                setValue('closed');
            }
        });

        // Cuando el componente se desmonta, cancela la suscripción
        return () => unsubscribe();
    }, [user]);

    return value;
}