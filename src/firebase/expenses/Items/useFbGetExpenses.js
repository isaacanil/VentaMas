
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from "../../../features/auth/userSlice";
import { selectExpenseList, setExpenseList } from "../../../features/expense/expensesListSlice";
import { toMillis } from "../../../utils/date/toMillis";
import { db } from "../../firebaseconfig";

export const useFbGetExpenses = (range) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const expenses = useSelector(selectExpenseList);
    const setExpenses = (expenses) => dispatch(setExpenseList(expenses));

    useEffect(() => {
        if (!user?.businessID) return;

        const start = toMillis(range?.startDate);
        const end = toMillis(range?.endDate);

        const expensesRef = collection(db, 'businesses', user.businessID, 'expenses');

        const q = start && end
            ? query(
                expensesRef,
                where('expense.dates.expenseDate', '>=', start),
                where('expense.dates.expenseDate', '<=', end)
            )
            : query(expensesRef);

            setLoading(true);

        const fetchData = () => {
            const unsubscribe = onSnapshot(q,
                async (snapshot) => {
                    const list = snapshot.docs.map((doc) => {
                        const expense = doc.data()?.expense;
                        return {
                            expense: {
                                ...expense,
                                dates: {
                                    ...expense.dates,
                                    createdAt: expense.dates.createdAt ? expense.dates.createdAt.seconds * 1000  : null,
                                    expenseDate: expense.dates.expenseDate ? expense.dates.expenseDate.seconds * 1000 : null,
                                }
                            }
                        }
                    },
                    );
                    setLoading(false);
                    setExpenses(list);
                    setError(null);
                },
                (error) => {
                    console.error("Error fetching expenses: ", error);
                    setError(error);
                    setLoading(false);
                }
            );
            return () => unsubscribe();
        };

        fetchData();

    }, [user, range]);

    return { expenses, loading, error };

}
