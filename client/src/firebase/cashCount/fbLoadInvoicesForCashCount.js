import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

const getInvoices = async (invoiceRefs) => {
    const invoices = await Promise.all(invoiceRefs.map(async (ref) => {
        const invoiceDoc = await getDoc(ref);

        if (!invoiceDoc) {
            console.error('invoiceDoc is undefined for ref:', ref);
            return null;
        }

        let invoiceData = invoiceDoc.data();

        if (!invoiceData) {
            console.error('invoiceData is undefined for ref:', ref);
            return null;
        }

        invoiceData = {
            ...invoiceData,
            ['data']: {
                ...invoiceData.data,
            }
        }

        return invoiceData;
    }));

    return invoices.filter(invoice => invoice !== null);
}


export const fbLoadInvoicesForCashCount = async (user, cashCountID, dataType) => {
    const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCountID);
    const cashCountDoc = await getDoc(cashCountRef);

    if (cashCountDoc.exists()) {
        const cashCountData = cashCountDoc.data();
        const invoiceRefs = cashCountData.cashCount.sales;

        switch (dataType) {
            case 'count':
                return invoiceRefs.length;
            case 'invoices':
                const invoices = await getInvoices(invoiceRefs);
                return invoices;
            case 'all':
                return {
                    count: invoiceRefs.length,
                    invoices: await getInvoices(invoiceRefs),
                    loading: false
                }
            default:
                return null;
        }

    } else {
        return null; 
    }
}