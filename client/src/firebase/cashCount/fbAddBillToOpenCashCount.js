import { collection, query, where } from 'firebase/firestore'

import { db } from '../firebaseconfig'
import { fbGetDoc, fbGetDocs, fbUpdateDoc } from '../firebaseOperations'

export const fbAddBillToOpenCashCount = async (user, invoiceRef, transaction = null) => {
    if (!user || !user?.businessID || !user?.uid) { return }

    const cashCountRef = collection(db, 'businesses', user?.businessID, 'cashCounts')
    const q = query(cashCountRef, where("cashCount.state", "==", "open"));

    try {
        const querySnapshot = await fbGetDocs(q, transaction);

        if (querySnapshot.empty) { return }

        let cashCountDoc;

        for (const doc of querySnapshot.docs) {
            const data = doc.data();

            // Obtén los datos del empleado desde la referencia
            const employeeSnapshot = await fbGetDoc(data.cashCount.opening.employee, transaction);

            const employeeData = employeeSnapshot.data();

            if (employeeData.user.id === user?.uid) {
                cashCountDoc = doc;
                break; // Sal del bucle una vez que encuentres el cuadre correcto
            }
        }

        if (!cashCountDoc) {
            console.error("No se encontró un cuadre de caja abierto para el cajero actual: ", error);
            return;
        }

        const { cashCount } = cashCountDoc.data()
        cashCount.sales.push(invoiceRef)
      
        await fbUpdateDoc(cashCountDoc.ref, { cashCount }, transaction)

        if (cashCount.id) {
            return (cashCount.id)
        } else {
            console.error("Error al encontrar el id del cuadre: ", error);
        }

    } catch (error) {
        console.error("Error al añadir la factura al cuadre: ", error);
    }
}

