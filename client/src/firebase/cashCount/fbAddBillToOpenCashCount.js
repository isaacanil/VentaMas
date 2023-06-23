import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'

import { db } from '../firebaseconfig'

export const fbAddBillToOpenCashCount = async (user, invoiceRef) => {
    if (!user || !user?.businessID) { return }

    const cashCountRef = collection(db, 'businesses', user?.businessID, 'cashCounts')
    const q = query(cashCountRef, where("cashCount.state", "==", "open"));

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) { return }

        const cashCountDoc = querySnapshot.docs[0]
        const { cashCount } = cashCountDoc.data()
        cashCount.sales.push(invoiceRef)
        await updateDoc(cashCountDoc.ref, { cashCount })
        
        if(cashCount.id){
            return (cashCount.id)
        }else{
            console.error("Error al encontrar el id del cuadre: ", error);
        }
     
    } catch (error) {
        console.error("Error al añadir la factura al cuadre: ", error);
    }
}