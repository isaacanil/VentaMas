import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { db } from "../../firebaseconfig"
import { DateTime } from "luxon"
import { date } from "yup"
import { getEmployeeData } from "./getEmployeeData"
import { convertTimeStampToMillis } from "../../../utils/date/convertTimeStampToDate"

export const fbGetCashCounts = async (user, setCashCounts, dateRange) => {
    if (!user || !user?.businessID) { return }
    const cashCountsRef = collection(db, 'businesses', user?.businessID, 'cashCounts')

    const userId = user?.uid
    const userRef = userId ? doc(db, "users", userId) : null
    const startDate = dateRange?.startDate ? DateTime.fromMillis(dateRange.startDate).toJSDate() : null;
    const endDate = dateRange?.endDate ? DateTime.fromMillis(dateRange.endDate).toJSDate() : null;

    let conditions = [];

    if (startDate !== null || endDate !== null) {
        conditions.push(where('cashCount.opening.date', '>=', startDate))
        conditions.push(where('cashCount.opening.date', '<=', endDate))
    }

    // Añade condiciones específicas basadas en el rol del usuario
    if (user.role === "cashier" && userRef) {
        conditions.push(where('cashCount.opening.employee', '==', userRef));
    }

    // Construye la consulta final a partir del array de condiciones
    const q = query(cashCountsRef, ...conditions, orderBy('cashCount.opening.date', 'desc'));

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
            })
    })
}

export const fbGetCashCountsDefault = async (user, setCashCounts) => {
    if (!user || !user?.businessID) { return }
    const cashCountsRef = collection(db, 'businesses', user?.businessID, 'cashCounts')

    const userId = user?.uid
    const userRef = userId ? doc(db, "users", userId) : null
    // const startDate = DateTime.now().startOf('day').toJSDate();
    // const endDate = DateTime.now().endOf('day').toJSDate();

    let conditions = [];


    // conditions.push(where('cashCount.opening.date', '>=', startDate))
    // conditions.push(where('cashCount.opening.date', '<=', endDate))


    // Añade condiciones específicas basadas en el rol del usuario

    if (user.role === "cashier" && userRef) {
        conditions.push(where('cashCount.opening.employee', '==', userRef));
    }
    conditions.push(where('cashCount.state', '==', 'open'))

    // Construye la consulta final a partir del array de condiciones
    const q = query(cashCountsRef, ...conditions, orderBy('cashCount.opening.date', 'desc'));

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
                console.error(error)
            })

    })
}