import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../features/auth/userSlice";
import { useEffect } from "react";
import { db } from "../firebaseconfig";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { clearCashReconciliation, setCashReconciliation } from "../../features/cashCount/cashStateSlice";

export const useCurrentCashDrawer = () => {

    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    useEffect(() => {
        try {
            if (!user || !user?.businessID) { return }

            const cashDrawerRef = collection(db, 'businesses', user?.businessID, 'cashCounts');

            const q = query(cashDrawerRef, where("cashCount.state", "in", ["open", "closing"]),);

            const unsubscribe = onSnapshot(q, querySnapshot => {
                const cashData = querySnapshot.docs.map(doc => doc.data());

                // Busca un registro con estado 'open'
                const openDrawerEntry = cashData.find(({ cashCount }) => cashCount.state === "open" && cashCount.opening.employee.id === user.uid);

                if (openDrawerEntry) {
                    dispatch(setCashReconciliation({ state: "open", cashCount: openDrawerEntry.cashCount }));
                    return; // Sal del callback porque ya encontraste lo que buscabas
                }

                // Si no hay 'open', busca 'closing'
                const closingDrawerEntry = cashData.find(({ cashCount }) => cashCount.state === "closing" && cashCount.opening.employee.id === user.uid);

                if (closingDrawerEntry) {
                    dispatch(setCashReconciliation({ state: "closing", cashCount: closingDrawerEntry.cashCount }));
                    return; // Sal del callback porque ya encontraste lo que buscabas
                }

                // Si no hay ni 'open' ni 'closing', limpia
                dispatch(clearCashReconciliation());
            });

            return () => unsubscribe();
        } catch (error) { }
    }, [user]);
}