import { useEffect, useState } from "react";
import { selectUser } from "../../features/auth/userSlice";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../firebaseconfig";

export const useFbGetClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(selectUser)
    useEffect(() => {
        if (!user || !user.businessID) {
            setLoading(false);
            return;
        }

        const { businessID } = user;
        const clientRef = collection(db, 'businesses', businessID, 'clients');
        const q = query(clientRef, orderBy('client.name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setClients([]);
                setLoading(false);
                return;
            }
            let clientArray = snapshot.docs.map((item) => item.data());
            
            setClients(clientArray);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

    return { clients, loading };
};