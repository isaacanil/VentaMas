import { collection, getDoc, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "../../firebaseconfig"
import { DateTime } from "luxon"
import { date } from "yup"
import { getEmployeeData } from "./getEmployeeData"
import { convertTimeStampToMillis } from "../../../utils/date/convertTimeStampToDate"

export const fbGetCashCounts = async (user, setCashCounts) => {
    if (!user || !user?.businessID) { return }
    const cashCountsRef = collection(db, 'businesses', user?.businessID, 'cashCounts')
    const q = query(cashCountsRef, orderBy('cashCount.opening.date', 'desc'))
    onSnapshot(q, (snapshot) => {
        const cashCountsArray = snapshot.docs.map(async doc => {
            let { cashCount } = doc.data()
            let data = cashCount

            const employeeData = await getEmployeeData(data.opening.employee);
            const approvalEmployeeData = await getEmployeeData(data.opening.approvalEmployee);
            const closingEmployeeData = await getEmployeeData(data.closing.employee);
            const closingApprovalEmployeeData = await getEmployeeData(data.closing.approvalEmployee);

            if (data.opening.date) { data.opening.date = convertTimeStampToMillis(data.opening.date) }
            delete data.sales
            delete data.stateHistory

            data = {
                ...data,
                updatedAt: convertTimeStampToMillis(data.updatedAt),
                createdAt: convertTimeStampToMillis(data.createdAt),
                opening: {
                    ...data.opening,
                    employee: employeeData,
                    approvalEmployee: approvalEmployeeData,

                },
                closing: {
                    ...data.closing,
                    date: data.closing.date ? convertTimeStampToMillis(data.closing.date) : null,
                    employee: closingEmployeeData,
                    approvalEmployee: closingApprovalEmployeeData
                },
                sales: []
            }
            return data
        })

        Promise.all(cashCountsArray)
            .then((cashCounts) => {
                setCashCounts(cashCounts)
            }).catch((error) => {
                console.log(error)
            })

    })
}