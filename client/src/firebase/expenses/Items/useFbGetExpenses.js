import { useEffect, useState } from "react";

import { collection, onSnapshot, query, where } from "firebase/firestore";

import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../../features/auth/userSlice";
import { db } from "../../firebaseconfig";
import { selectExpenseList, setExpenseList } from "../../../features/expense/expensesListSlice";

export const useFbGetExpenses = (dates) => {
    const dispatch = useDispatch();
    
    const user = useSelector(selectUser);
    
    const [lastDates, setLastDates] = useState(null);
    
    const expenses = useSelector(selectExpenseList);
    const setExpenses = (expenses) => dispatch(setExpenseList(expenses));
    console.log(dates);
    console.log(expenses);
    console.log(lastDates);

    
    useEffect(() => {
        if (!user?.businessID) return;
        
        setLastDates(dates);

        const expensesCollection = collection(db, 'businesses', user.businessID, 'expenses');
        const startDate = new Date(dates?.startDate);
        const endDate = new Date(dates?.endDate);

        const expensesQuery = query(
            expensesCollection,
            where('expense.dates.createdAt', '>=', startDate),
            where('expense.dates.createdAt', '<=', endDate)
        );

        const fetchData = () => {
            const unsubscribe = onSnapshot(expensesQuery, async(snapshot) => {
                const expenseArray = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    console.log(data);
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

    }, [user, dates]);

    return { expenses };

}
