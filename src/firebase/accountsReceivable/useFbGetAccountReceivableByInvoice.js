import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const useFbGetAccountReceivableByInvoice = (invoiceId) => {
    const user = useSelector(selectUser);
    const [accountsReceivable, setAccountsReceivable] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.businessID || !invoiceId) {
            setAccountsReceivable([]);
            return;
        }

        setLoading(true);

        const ref = collection(
            db,
            'businesses',
            user.businessID,
            'accountsReceivable',
        );
        const q = query(ref, where('invoiceId', '==', invoiceId));

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setAccountsReceivable(list);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching accounts receivable by invoice:', err);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [user?.businessID, invoiceId]);

    return { accountsReceivable, loading };
};
