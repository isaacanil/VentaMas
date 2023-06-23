import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { DateTime } from "luxon";

const getInvoices = async (invoiceRefs) => {
    console.log(invoiceRefs)
    const invoices = await Promise.all(invoiceRefs.map(async (ref) => {
        const invoiceDoc = (await getDoc(ref)).data();
        let invoiceData = invoiceDoc;

        invoiceData = {
            ...invoiceData,
            ['data']: {
                ...invoiceData.data,
                
            }
        }
        return invoiceData;
    }));

    return invoices;
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