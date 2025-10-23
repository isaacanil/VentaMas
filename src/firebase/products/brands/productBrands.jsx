import { collection, doc, onSnapshot, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../../features/auth/userSlice";
import { db } from "../../firebaseconfig";

export const useListenProductBrands = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user = useSelector(selectUser);

    useEffect(() => {
        let unsubscribe;
        const fetchData = async () => {
            try {
                if (!user?.businessID) return;
                setLoading(true);
                unsubscribe = await listenProductBrands(user, setData);
                setLoading(false);
            } catch (err) {
                setError(err);
            }
        };

        fetchData();

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [user]);

    return { data, loading, error };
};

const listenProductBrands = async (user, setData) => {
    const brandsRef = collection(db, `businesses/${user.businessID}/productBrands`);
    const unsubscribe = onSnapshot(brandsRef, (snapshot) => {
        const items = snapshot.docs.map((docSnap) => docSnap.data());
        setData(items);
    });
    return unsubscribe;
};

export const fbAddProductBrand = async (user, data) => {
    if (!user?.businessID) return;
    const newBrand = {
        ...data,
        id: nanoid(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };
    const brandRef = doc(db, `businesses/${user.businessID}/productBrands/${newBrand.id}`);
    await setDoc(brandRef, newBrand);
};

export const fbUpdateProductBrand = async (user, data) => {
    if (!user?.businessID || !data?.id) return;
    const brandRef = doc(db, `businesses/${user.businessID}/productBrands/${data.id}`);
    await updateDoc(brandRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
};
