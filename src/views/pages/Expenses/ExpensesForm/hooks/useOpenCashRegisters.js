import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../../../../../firebase/firebaseconfig";

export const useOpenCashRegisters = (businessID, isOpen) => {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        if (!businessID || !isOpen) return;

        const ref = collection(db, 'businesses', businessID, 'cashCounts');
        const q = query(ref, where('cashCount.state', '==', 'open'));

        const unsub = onSnapshot(q, async snapshot => {
            const regs = await Promise.all(snapshot.docs.map(async docSnap => {
                const data = docSnap.data();
                const { id, incrementNumber, opening } = data.cashCount || {};
                if (!id) return null;

                // Format date
                const date = opening?.date?.toDate ? opening.date.toDate() : new Date(opening.date);
                const dateStr = date.toLocaleDateString('es-ES');

                // Fetch employee name
                let name = 'Usuario desconocido';
                if (opening?.employee?.path) {
                    try {
                        const empSnap = await getDoc(doc(db, opening.employee.path));
                        if (empSnap.exists()) {
                            const d = empSnap.data();
                            name = d.name || d.user?.name || name;
                        }
                    } catch (fetchError) {
                        console.warn('Failed to resolve employee name', fetchError);
                    }
                }

                return {
                    label: `Cuadre #${incrementNumber || 'N/A'} - ${dateStr} - ${name}`,
                    value: id,
                };
            }));
            setOptions(regs.filter(Boolean));
        });

        return () => unsub();
    }, [businessID, isOpen]);

    return options;
};
