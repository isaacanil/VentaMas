import { getFunctions, httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/firebaseconfig";

const handleInvoice = httpsCallable(functions, "handleInvoiceRequest");
export async function submitInvoice({
    user,
    cart,
    client,
    accountsReceivable = [],
    insuranceAR = null,
    insuranceAuth = null,
    ncfType = null,
    taxReceiptEnabled = false,
    dueDate = null,
    insuranceEnabled = false
}) {
    // Validar que el usuario y el carrito no sean nulos
    if (!user || !cart) {
        throw new Error("Se requieren los campos `user` y `cart`");
    }

    // Validar tipos de taxReceipt
    if (taxReceiptEnabled && (typeof ncfType !== 'string' || !ncfType.trim())) {
        throw new Error("`ncfType` inválido cuando `taxReceiptEnabled=true`");
    }
    try {
        const { data } = await handleInvoice({ user, cart, client, accountsReceivable, insuranceAR, insuranceAuth, ncfType, taxReceiptEnabled, dueDate, insuranceEnabled });
    
        return data;

    } catch (err) {
        throw err;
    }
}