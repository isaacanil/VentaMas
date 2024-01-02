import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../features/auth/userSlice";
import { useEffect } from "react";
import { db } from "../firebaseconfig";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { clearCashReconciliation, setCashReconciliation } from "../../features/cashCount/cashStateSlice";
import { convertTimeStampToMillis } from "../../utils/date/convertTimeStampToDate";
import { getEmployeeData } from "./fbGetCashCounts/getEmployeeData";

export const useCurrentCashDrawer = () => {

    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    useEffect(() => {
        try {
            if (!user || !user?.businessID) { return }

            const cashDrawerRef = collection(db, 'businesses', user?.businessID, 'cashCounts');

            const q = query(cashDrawerRef, where("cashCount.state", "in", ["open", "closing"]),);

            const unsubscribe = onSnapshot(q, async querySnapshot => {
                const docsPromise = querySnapshot.docs.map(async doc => {
                    const data = doc.data();
                    if(data.cashCount.opening.date) {
                        data.cashCount.opening.date = convertTimeStampToMillis(data.cashCount.opening.date);
                    }
                    
                    if (data.cashCount && data.cashCount.createdAt) {
                        data.cashCount.createdAt = convertTimeStampToMillis(data.cashCount.createdAt);
                    }
                    if (data.cashCount && data.cashCount.updatedAt) {
                        data.cashCount.updatedAt = convertTimeStampToMillis(data.cashCount.updatedAt);
                    }
                    const employeeData = await getEmployeeData(data.cashCount.opening.employee);
                    const approvalEmployeeData = await getEmployeeData(data.cashCount.opening.approvalEmployee);
                    const closingEmployeeData = await getEmployeeData(data.cashCount.closing.employee);
                    const closingApprovalEmployeeData = await getEmployeeData(data.cashCount.closing.approvalEmployee);

                    delete data.cashCount.sales
                    delete data.cashCount.stateHistory

                    data.cashCount = {
                        ...data.cashCount,
                        opening: {
                            ...data.cashCount.opening,
                            employee: employeeData,
                            approvalEmployee: approvalEmployeeData,
                        },
                        closing: {
                            ...data.cashCount.closing,
                            employee: closingEmployeeData,
                            approvalEmployee: closingApprovalEmployeeData
                        },
                        sales: []
                    }
                    return data;
                });
                const cashData = await Promise.all(docsPromise);
                // Busca un registro con estado 'open'
                console.log("cash count: ", cashData)
                const openDrawerEntry = cashData.find(({ cashCount }) => cashCount.state === "open" && cashCount.opening.employee.id === user.uid);

                if (openDrawerEntry) {
                    dispatch(setCashReconciliation({ state: "open", cashCount: openDrawerEntry.cashCount }));
                    return; // Sal del callback porque ya encontraste lo que buscabas
                }

                // Si no hay 'open', busca 'closing'
                const closingDrawerEntry = cashData.find(({ cashCount }) => cashCount.state === "closing" && cashCount.opening.employee.id === user.uid);

                if (closingDrawerEntry) {
                    dispatch(setCashReconciliation({ state: "closing", cashCount: closingDrawerEntry.cashCount }));
                    return; // Sal del callback porque ya encontraste lo que buscabas
                }

                // Si no hay ni 'open' ni 'closing', limpia
                dispatch(clearCashReconciliation());
            });

            return () => unsubscribe();
        } catch (error) { }
    }, [user]);
}