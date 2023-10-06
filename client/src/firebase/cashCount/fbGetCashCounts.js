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

            if(data.closing.employee){
                const closingEmployeeRef = data.closing.employee;
                const closingEmployeeDoc = (await getDoc(closingEmployeeRef)).data()
                const closingEmployeeUser = closingEmployeeDoc.user;
                const closingEmployeeData = {
                    id: closingEmployeeUser.id,
                    name: closingEmployeeUser.name,
                }
                data = {
                    ...data,
                    closing: {
                        ...data.closing,
                        employee: closingEmployeeData
                    }
                }
            }
            if(data.closing.approvalEmployee){
                const closingApprovalEmployeeRef = data.closing.approvalEmployee;
                const closingApprovalEmployeeDoc = (await getDoc(closingApprovalEmployeeRef)).data()
                const closingApprovalEmployeeUser = closingApprovalEmployeeDoc.user;
                const closingApprovalEmployeeData = {
                    id: closingApprovalEmployeeUser.id,
                    name: closingApprovalEmployeeUser.name,
                }
                data = {
                    ...data,
                    closing: {
                        ...data.closing,
                        approvalEmployee: closingApprovalEmployeeData
                    }
                }
            }
            

            const invoiceRef = data.sales.map(ref => ref);
            

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