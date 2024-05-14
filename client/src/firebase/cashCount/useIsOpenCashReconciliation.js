import { collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { useEffect, useState } from "react";
import { selectUser } from "../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { fbGetDocs } from "../firebaseOperations";

export function useIsOpenCashReconciliation() {
    const [value, setValue] = useState(false);
    const [cashReconciliation, setCashReconciliation] = useState(null);
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!user || !user?.businessID) { return }
        const cashReconciliationRef = collection(db, 'businesses', user?.businessID, 'cashCounts');
        const q = query(cashReconciliationRef, where("cashCount.state", "in", ["open", "closing"]));

        const unsubscribe = onSnapshot(q,
            querySnapshot => {
                const isOpen = querySnapshot.docs.some(doc => doc.data().cashCount.state === 'open');
                const isEmpty = querySnapshot.empty;
                const isClosing = querySnapshot.docs.some(doc => doc.data().cashCount.state === 'closing');
                const isSameUser = querySnapshot.docs.some(doc => doc.data().cashCount.opening.employee.id === user.uid)
                if (isEmpty) {
                    setValue('none'); // o 'empty' o null, lo que prefieras
                    return;
                }
                if (isOpen && isSameUser) {
                    setValue('open');
                } else if (isClosing && isSameUser) {
                    setValue('closing');
                } else {
                    setValue('closed');
                }
            },
            error => {
                console.error("Error en la suscripción a Firestore: ", error);
                // Aquí podrías establecer algún estado para manejar este error en la UI si lo necesitas.
            }

        );

        // Cuando el componente se desmonta, cancela la suscripción
        return () => unsubscribe();
    }, [user]);

    return { status: value, cashCount: cashReconciliation };
}

export async function checkOpenCashReconciliation(user, transaction = null) {
    try {
        if (!user || !user.businessID || !user.uid) {
            throw new Error('Datos del usuario incompletos');
        }
        const employeeRef = doc(db, 'users', user.uid);

        const cashReconciliationRef = collection(db, 'businesses', user.businessID, 'cashCounts');
        const q = query(cashReconciliationRef,
            where("cashCount.state", "in", ["open", "closing"]),
            where("cashCount.opening.employee", "==", employeeRef)
        );
        const querySnapshot = await fbGetDocs(q);

        if (querySnapshot.empty) {
            return { state: 'none', cashCount: null };
        }
        const cashCountOpen = (doc) => doc.data().cashCount.state === 'open';
        const cashCountClosing = (doc) => doc.data().cashCount.state === 'closing';

        const cashCountDoc = querySnapshot.docs.find(doc => cashCountOpen(doc) || cashCountClosing(doc));

        if (!cashCountDoc) {
            return { state: 'closed', cashCount: null };
        }

        if (cashCountOpen(cashCountDoc)) {
            return { state: 'open', cashCount: cashCountDoc.data().cashCount };
        } else if (cashCountClosing(cashCountDoc)) {
            return { state: 'closing', cashCount: cashCountDoc.data().cashCount };
        } else {
            return { state: 'closed', cashCount: null };
        }
    } catch (error) {
        console.error("Error al consultar Firestore: ", error);
        throw error; // Re-lanza el error para manejarlo más adelante si es necesario
    }
}

