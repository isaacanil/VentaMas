import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { db } from "../firebaseconfig";

export const useFbGetClientsOnOpen = ({ isOpen }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const user = useSelector(selectUser);

    const unsubscribeRef = useRef(null);

    useEffect(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        if (!isOpen || !user?.businessID) {
            setClients([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const clientRef = collection(db, 'businesses', user.businessID, 'clients');
        const q = query(clientRef, orderBy('client.name', 'asc'));

        unsubscribeRef.current = onSnapshot(
            q,
            snap => {
                const list = snap.docs.map(doc => doc.data());
                setClients(list);
                setLoading(false);
            },
            err => {
                console.error('Firestore listener error:', err);
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, [isOpen, user?.businessID]);

    return { clients, loading };
};
