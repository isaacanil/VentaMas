import { collection, getDoc, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { DateTime } from "luxon"
import { date } from "yup"

export const fbGetCashCounts = async (user, setCashCounts) => {
    if (!user || !user?.businessID) { return }
    const cashCountsRef = collection(db, 'businesses', user?.businessID, 'cashCounts')
    const q = query(cashCountsRef, orderBy('cashCount.opening.date', 'desc'))
    onSnapshot(q, (snapshot) => {
        const cashCountsArray = snapshot.docs.map(async doc => {
            let { cashCount } = doc.data()
            let data = cashCount

            const employeeRef = data.opening.employee;
            const employeeDoc = (await getDoc(employeeRef)).data()
            const employeeUser = employeeDoc.user;
            console.log(employeeUser)
            const employeeData = {
                id: employeeUser.id,
                name: employeeUser.name,
            }

            const approvalEmployeeRef = data.opening.approvalEmployee;
            const approvalEmployeeDoc = (await getDoc(approvalEmployeeRef)).data()
            const approvalEmployeeUser = approvalEmployeeDoc.user;
            const approvalEmployeeData = {
                id: approvalEmployeeUser.id,
                name: approvalEmployeeUser.name,
            }

            const invoiceRef = data.sales.map(ref => ref);
            console.log(invoiceRef)

            // const invoices = await Promise.all(invoiceRef.map(async (ref) => {
            //     const invoiceDoc = (await getDoc(ref)).data()
            //     let invoiceData = invoiceDoc;

            //     // invoiceData = {
            //     //     ...invoiceData,
            //     //     ['data']: {
            //     //         ...invoiceData.data,
            //     //         ['date']: DateTime.fromMillis(invoiceData.data.date.seconds * 1000 + invoiceData.data.date.nanoseconds / 1e6).toFormat('yyyy-MM-dd HH:mm:ss')
            //     //     }
            //     // }
            //     return invoiceData
            // }));

            delete data.sales
            delete data.stateHistory

            data = {
                ...data,
                opening: {
                    ...data.opening,
                    employee: employeeData,
                    approvalEmployee: approvalEmployeeData,

                },
                sales: []
            }
            console.log(data)
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