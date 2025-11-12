import { collection, onSnapshot, query, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { db } from "../firebaseconfig"


export const useFbGetDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(selectUser);

    useEffect(() => {
        if (!user || !user?.businessID) {
            setLoading(false);
            return;
        }

        const doctorsRef = collection(db, 'businesses', user.businessID, 'doctors');
        const activeQuery = query(doctorsRef, where("status", "==", "active"));

        setLoading(true);

        try {
            const unsubscribe = onSnapshot(activeQuery, (snapshot) => {
                let doctorsArray = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setDoctors(doctorsArray);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching doctors:", error);
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error("Error setting up doctors listener:", error);
            setLoading(false);
        }
    }, [user]);

    return { doctors, loading };
} 