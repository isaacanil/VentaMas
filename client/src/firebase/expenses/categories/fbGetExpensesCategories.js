import { useEffect, useState } from "react";

import { collection, onSnapshot } from "firebase/firestore";

import { useSelector } from "react-redux";
import { selectUser } from "../../../features/auth/userSlice";
import { db } from "../../firebaseconfig";

export const useFbGetExpensesCategories = () => {
    const user = useSelector(selectUser);

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (!user || !user?.businessID) return;

        const categoriesCollection = collection(db, 'businesses', user.businessID, 'expensesCategories');

        const fetchData = async () => {
            const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
                const categoriesArray = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    console.log(data)
                    return {
                        category: {
                            ...data.category,
                            createdAt: data?.category.createdAt.seconds * 1000,
                        }
                    }});
                setCategories(categoriesArray);
            });

            return () => unsubscribe();
        };

        fetchData();

    }, [user]);

    return { categories };

}
