import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { DateTime } from "luxon";

const getInvoices = async (invoiceRefs) => {
    console.log(invoiceRefs);
    const invoices = await Promise.all(invoiceRefs.map(async (ref) => {
        const invoiceDoc = await getDoc(ref);
        
        // Verificar si invoiceDoc no es undefined antes de intentar acceder a data()
        if (!invoiceDoc) {
            console.error('invoiceDoc is undefined for ref:', ref);
            return null; // o manejar de otra manera
        }

        let invoiceData = invoiceDoc.data();
        // Verificar si invoiceData no es undefined antes de intentar acceder a data
        if (!invoiceData) {
            console.error('invoiceData is undefined for ref:', ref);
            return null; // o manejar de otra manera
        }

        invoiceData = {
            ...invoiceData,
            ['data']: {
                ...invoiceData.data,
                // ... otros campos que quieras agregar o modificar
            }
        }

        return invoiceData;
    }));

    // Filtrar resultados nulos si decidiste retornar null para documentos no encontrados
    return invoices.filter(invoice => invoice !== null);
}


export const fbLoadInvoicesForCashCount = async (user, cashCountID, dataType) => {
   
    const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCountID);
    const cashCountDoc = await getDoc(cashCountRef);

    if (cashCountDoc.exists()) {
        const cashCountData = cashCountDoc.data();
        const invoiceRefs = cashCountData.cashCount.sales;

        switch(dataType) {
            case 'count':
                return invoiceRefs.length;
            case 'invoices':
                const invoices = await getInvoices(invoiceRefs);
                return invoices;
            case 'all':
                return {
                    count: invoiceRefs.length,
                    invoices: await getInvoices(invoiceRefs)
                }
            default:
                console.log('Invalid data type!');
                return null;
        }

    } else {
        console.log('No such cash count!');
        return null; // or appropriate default value
    }
}