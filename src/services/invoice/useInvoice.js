import { useState } from "react";
import { submitInvoice } from "./invoice.service";
import { useDispatch } from "react-redux";
import { getCashCountStrategy } from "../../notification/cashCountNotification/cashCountNotificacion";
import { FunctionsError } from "firebase/functions";


export default function useInvoice() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const dispatch = useDispatch();

    const processInvoice = async ({
        user,
        cart,
        client,
        accountsReceivable = [],
        insuranceAR = null,
        insuranceAuth = null,
        ncfType = null,
        taxReceiptEnabled = false,
        dueDate = null,
        insuranceEnabled = false,
    }) => {
        setLoading(true);
        setError(null);

        try {
            
            // const invoiceData = await submitInvoice({
            //     user,
            //     cart,
            //     client,
            //     accountsReceivable,
            //     insuranceAR,
            //     insuranceAuth,
            //     ncfType,
            //     taxReceiptEnabled,
            //     dueDate,
            //     insuranceEnabled
            // });
            // return invoiceData;
        } catch (err) {
            setError(err);

            const errorMessage = err.message;
            const errorCode = err.code;
            const errorDetails = err.details;

            if (["cashCount-none", "cashCount-closed", "cashCount-closing"].includes(errorMessage)) {
                const cashCountState = errorMessage.split("-")[1];
                const cashCountStrategy = getCashCountStrategy(cashCountState, dispatch);
                cashCountStrategy.handleConfirm();
                return;
            }else{
                console.error("Invoice processing error:", {
                    code: errorCode,
                    message: errorMessage,
                    details: errorDetails
                });
            }

            return;
        } finally {
            setLoading(false);
        }
    }

    return {
        loading,
        error,
        processInvoice
    }
}