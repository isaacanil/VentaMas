import { runTransaction } from "firebase/firestore";
import { validateInvoiceCart } from "../../utils/invoiceValidation";
import { db } from "../../firebase/firebaseconfig";
import * as antd from 'antd'
import { getCashCountStrategy } from "../../notification/cashCountNotification/cashCountNotificacion";
import { checkOpenCashReconciliation } from "../../firebase/cashCount/useIsOpenCashReconciliation";
import { fbGetAndUpdateTaxReceipt } from "../../firebase/taxReceipt/fbGetAndUpdateTaxReceipt";
import { fbUpsertClient } from "../../firebase/client/fbUpsertClient";
import { GenericClient } from "../../features/clientCart/clientCartSlice";
import { fbUpdateProductsStock } from "../../firebase/products/fbUpdateProductStock";
import { fbAddInvoice } from "../../firebase/invoices/fbAddInvoice";
import { fbAddAR } from "../../firebase/accountsReceivable/fbAddAR";
import { fbAddInstallmentAR } from "../../firebase/accountsReceivable/fbAddInstallmentAR";

const NCF_TYPES = {
    'CREDITO FISCAL': 'CREDITO FISCAL',
    'CONSUMIDOR FINAL': 'CONSUMIDOR FINAL'
}

export async function processInvoice({
    user,
    cart,
    client,
    accountsReceivable,
    ncfType,
    taxReceiptEnabled = false,
    setLoading = () => { },
    dispatch
}) {
    try {
        //Validar que el carrito tenga productos
        verifyCartItems(cart);
        //Cuadre de caja
        const { cashCount } = await validateCashReconciliation({ user, dispatch, });
        //Comprobante fiscal
        const ncfCode = await handleTaxReceiptGeneration({ user, taxReceiptEnabled, ncfType, });
        //Cliente
        const clientData = await retrieveAndUpdateClientData({ user, client, });
        //Actualizar stock 
        await adjustProductInventory({ user, products: cart.products, });
        //Crear factura
        const invoice = await generateFinalInvoice({ user, cart, clientData, ncfCode, cashCount, })
        //Cuentas por cobrar
        await manageReceivableAccounts({ user, accountsReceivable, invoice })

        return { invoice }

    } catch (error) {
        setLoading({ status: false, message: "" })
        throw error
    }
}

async function verifyCartItems(cart) {
    //validar que el carrito tenga productos
    const { isValid, message } = validateInvoiceCart(cart);
    if (!isValid) {
        throw new Error(message)
    }
}
async function validateCashReconciliation({ user, dispatch, transaction }) {
    //revisar si hay cuadre de caja abierto y del usuario actual
    try {
        const { state, cashCount } = await checkOpenCashReconciliation(user, transaction);

        const handleCashReconciliationConfirm = () => {
            const cashCountStrategy = getCashCountStrategy(state, dispatch)
            cashCountStrategy.handleConfirm()
        }
        if (state === 'open') {
            return { cashCount };
        }

        if (state === 'closed' || state === 'closing') {
            handleCashReconciliationConfirm();
            return { cashCount: null };
        }
    } catch (error) {
        throw error
    }
}
async function handleTaxReceiptGeneration({ user, taxReceiptEnabled, ncfType, transaction = null }) {
    if (!taxReceiptEnabled) {
        return null;
    }
    if (!user || !taxReceiptEnabled || !NCF_TYPES[ncfType]) {
        return null;
    }
    try {
        return await fbGetAndUpdateTaxReceipt(user, NCF_TYPES[ncfType], transaction);
    } catch (error) {
        console.error(`Error processing tax receipt for type ${ncfType}:`, error.message);
        throw new Error('Failed to process tax receipt');
    }
}
async function retrieveAndUpdateClientData({ user, client, transaction = null }) {
    const clientId = client.id;
    if (!client) {
        console.log('No client selected');
        return;
    }
    if (!clientId) {
        return { client: GenericClient }
    }
    await fbUpsertClient(user, client, transaction)
    return { client }
}
async function adjustProductInventory({ user, products, transaction = null }) {
    try {
        await fbUpdateProductsStock(products, user)
    } catch (error) {
        throw error;
    }
}
async function generateFinalInvoice({ user, cart, cashCount, ncfCode, clientData, transaction }) {
    try {
        const bill = {
            ...cart,
            NCF: ncfCode,
            client: clientData.client,
            cashCountId: cashCount.id
        }
        await fbAddInvoice(bill, user, transaction)
        return bill
    } catch (error) {
        throw error
    }

}
async function manageReceivableAccounts({ user, accountsReceivable, invoice }) {
    try {
        if (!invoice?.isAddedToReceivables) return;
        if(!accountsReceivable?.totalInstallments) {
            throw new Error('Installments data is missing')
        }
      
        const ar = await fbAddAR({
            user,
            accountsReceivable
        })
        console.log(ar)
        await fbAddInstallmentAR({
            user,
            ar
        })
    } catch (error) {
        throw error;
    }
}