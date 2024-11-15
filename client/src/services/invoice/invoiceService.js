import { validateInvoiceCart } from "../../utils/invoiceValidation";
import { getCashCountStrategy } from "../../notification/cashCountNotification/cashCountNotificacion";
import { checkOpenCashReconciliation } from "../../firebase/cashCount/useIsOpenCashReconciliation";
import { fbGetAndUpdateTaxReceipt } from "../../firebase/taxReceipt/fbGetAndUpdateTaxReceipt";
import { fbUpsertClient } from "../../firebase/client/fbUpsertClient";
import { GenericClient } from "../../features/clientCart/clientCartSlice";
import { fbUpdateProductsStock } from "../../firebase/products/fbUpdateProductStock";
import { fbAddInvoice } from "../../firebase/invoices/fbAddInvoice";
import { fbAddAR } from "../../firebase/accountsReceivable/fbAddAR";
import { fbAddInstallmentAR } from "../../firebase/accountsReceivable/fbAddInstallmentAR";
import { fbGenerateInvoiceFromPreorder } from "../../firebase/invoices/fbGenerateInvoiceFromPreorder";
import { Timestamp } from "firebase/firestore";

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
    dispatch,
    dueDate = null
}) {
    try {
        setLoading({ status: true, message: "Procesando factura..." });
        verifyCartItems(cart);

        const { cashCount } = await validateCashReconciliation({ user, dispatch, });

        if (!cashCount) {
            throw new Error('No se puede procesar la factura sin cuadre de caja');
        }

        const [ncfCode, clientData] = await Promise.all([
            handleTaxReceiptGeneration({ user, taxReceiptEnabled, ncfType }),
            retrieveAndUpdateClientData({ user, client }),
        ]);

        const [invoice] = await Promise.all([
            cart?.preorderDetails?.isOrWasPreorder
                ? generalInvoiceFromPreorder({ user, cart, cashCount, ncfCode })
                : generateFinalInvoice({ user, cart, clientData, ncfCode, cashCount, dueDate }),
            adjustProductInventory({ user, products: cart.products }),
        ]);

        await manageReceivableAccounts({ user, accountsReceivable, invoice })

        return { invoice }

    } catch (error) {
        setLoading({ status: false, message: "" })
        throw error
    } finally {
        setLoading({ status: false, message: "" })
    }
}

function checkIfHasDueDate({ cart, dueDate }) {
    if (!dueDate) {
        return cart;
    }
    const date = Timestamp.fromMillis(dueDate);
    return {
        ...cart,
        dueDate: date,
        hasDueDate: true
    }
}

function verifyCartItems(cart) {
    const { isValid, message } = validateInvoiceCart(cart);
    if (!isValid) {
        throw new Error(message)
    }
}
async function validateCashReconciliation({ user, dispatch, transaction }) {
    try {
        const { state, cashCount } = await checkOpenCashReconciliation(user, transaction);

        if (state === 'open') {
            return { cashCount };
        }

        if (['closed', 'closing', 'none'].includes(state)) {
            const cashCountStrategy = getCashCountStrategy(state, dispatch)
            cashCountStrategy.handleConfirm()
            return { cashCount: null };
        }
    } catch (error) {
        throw new Error(`Error al validar cuadre de caja: ${error.message}`);
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
        return { client: GenericClient };
    }
    if (!clientId) {
        return { client: GenericClient };
    }
    try {
        await fbUpsertClient(user, client);
        return { client };
    } catch (error) {
        throw new Error(`Error al actualizar los datos del cliente: ${error.message}`);
    }
}
async function adjustProductInventory({ user, products }) {
    await fbUpdateProductsStock(products, user)
}
async function generateFinalInvoice({ user, cart, cashCount, ncfCode, clientData, dueDate }) {
    try {
        const cartWithDueDate = dueDate ? checkIfHasDueDate({ cart, dueDate }) : cart;
        const bill = {
            ...cartWithDueDate,
            NCF: ncfCode,
            client: clientData.client,
            cashCountId: cashCount.id
        }
        return await fbAddInvoice(bill, user) || bill;
    } catch (error) {
        throw new Error(`Error al generar la factura final: ${error.message}`);
    }
}

async function manageReceivableAccounts({ user, accountsReceivable, invoice }) {
    try {
        if (!invoice?.isAddedToReceivables) return;
        if (!accountsReceivable?.totalInstallments) {
            throw new Error('Installments data is missing')
        }
        const ar = await fbAddAR({ user, accountsReceivable })
        await fbAddInstallmentAR({ user, ar })
    } catch (error) {
        throw new Error(`Error al gestionar cuentas por cobrar: ${error.message}`);
    }
}

async function generalInvoiceFromPreorder({ user, cart, cashCount, ncfCode }) {
    try {
        if (!cart?.preorderDetails?.isOrWasPreorder || !cart?.status == "pending") {
            throw new Error("Invalid preorder data");
        }
        const bill = {
            ...cart,
            NCF: ncfCode,
            cashCountId: cashCount.id
        }
        await fbGenerateInvoiceFromPreorder(user, bill);
        return bill;
    } catch (error) {
        console.error(error);
        throw error;
    }
}