import { useEffect, useState } from "react";

import { collection, onSnapshot } from "firebase/firestore";

import { useSelector } from "react-redux";
import { selectUser } from "../../../features/auth/userSlice";
import { db } from "../../firebaseconfig";

export const useFbGetExpenses = () => {
    const user = useSelector(selectUser);

    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        if (!user || !user?.businessID) return;

        const expensesCollection = collection(db, 'businesses', user.businessID, 'expenses');

        const fetchData = async () => {
            const unsubscribe = onSnapshot(expensesCollection, (snapshot) => {
                const expenseArray = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        expense: {
                            ...data.expense,
                            dates: {
                                ...data.expense.dates,
                                createdAt: data?.expense.dates.createdAt.seconds * 1000,
                                expenseDate: data?.expense.dates.expenseDate.seconds * 1000,
                            }
                        }
                    }});
                setExpenses(expenseArray);
            });

            return () => unsubscribe();
        };

        fetchData();

    }, [user]);

    return { expenses };

}
