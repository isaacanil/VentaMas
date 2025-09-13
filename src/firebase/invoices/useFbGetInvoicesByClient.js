import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { selectUser } from "../../features/auth/userSlice";
import { db } from "../firebaseconfig";

export const useFbGetInvoicesByClient = (clientId, dateRange = null) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const user = useSelector(selectUser);

    useEffect(() => {
        if (!user?.businessID || !clientId) {
            setInvoices([]);
            return;
        }

        setLoading(true);

        const invoicesRef = collection(db, 'businesses', user.businessID, 'invoices');
        let q;
        if (dateRange && Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
            const [startDate, endDate] = dateRange;
            q = query(
                invoicesRef,
                where('data.client.id', '==', clientId),
                where('data.date', '>=', startDate.toDate ? startDate.toDate() : startDate),
                where('data.date', '<=', endDate.toDate ? endDate.toDate() : endDate),
                orderBy('data.date', 'desc')
            );
        } else {
            q = query(
                invoicesRef,
                where('data.client.id', '==', clientId),
                orderBy('data.date', 'desc')
            );
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    setInvoices([]);
                    setLoading(false);
                    return;
                }
                const invoicesData = snapshot.docs.map((doc) => doc.data().data);
                setInvoices(invoicesData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching invoices by client:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.businessID, clientId, dateRange]);

    return { invoices, loading };
}; 