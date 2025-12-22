import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const useFbGetAccountReceivablePayments = (arId) => {
    const user = useSelector(selectUser);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const deps = [user?.businessID, arId];
    const [prevDeps, setPrevDeps] = useState(deps);

    if ((!user?.businessID || !arId)) {
        if (payments.length > 0) setPayments([]);
        if (loading) setLoading(false);
    } else {
        const depsChanged = deps.some((d, i) => d !== prevDeps[i]);
        if (depsChanged) {
            setPrevDeps(deps);
            setLoading(true);
        }
    }

    useEffect(() => {
        if (!user?.businessID || !arId) {
            return undefined;
        }

        const ref = collection(
            db,
            'businesses',
            user.businessID,
            'accountsReceivablePayments',
        );
        const q = query(ref, where('arId', '==', arId));

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                // Sort by date descending
                list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
                setPayments(list);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching accounts receivable payments:', err);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [user?.businessID, arId]);

    return { payments, loading };
};
