import { CancelShipping, toggleCart } from "../../../features/cart/cartSlice";
import { deleteClient, handleClient } from "../../../features/clientCart/clientCartSlice";
import { addNotification } from "../../../features/notification/NotificationSlice";
import { IncreaseEndConsumer, IncreaseTaxCredit, clearTaxReceiptData } from "../../../features/taxReceipt/taxReceiptSlice";
import { fbAddInvoice } from "../../../firebase/invoices/fbAddInvoice";
import { fbUpdateProductsStock } from "../../../firebase/products/fbUpdateProductStock";
import { fbUpdateTaxReceipt } from "../../../firebase/taxReceipt/fbUpdateTaxReceipt";

export const handleTaxReceipt = async (dispatch, taxReceiptEnabled, ncfStatus) => {
    try {
        if (!taxReceiptEnabled) return;
        if (ncfStatus) {
            dispatch(IncreaseTaxCredit());
        } else {
            dispatch(IncreaseEndConsumer());
        }
    } catch (error) {
        console.log(error);
        dispatch(addNotification({ message: "Ocurrió un error al manejar el comprobante fiscal. Intente de nuevo.", type: 'error' }));
    }
};

export const verifyAndAdvanceTaxReceiptProcess = async (dispatch, taxReceiptEnabled, ncfCode) => {
    if (taxReceiptEnabled && ncfCode === null) {
        dispatch(addNotification({ message: "No hay comprobante fiscal seleccionado", type: 'error' }));
        return;
    }
    if (taxReceiptEnabled) dispatch(addTaxReceiptInState(ncfCode));
}

export const savingDataToFirebase = async (dispatch, user, bill, taxReceipt) => {
    try {
        if (selectMode === true) {
            fbAddInvoice(bill, user)
            { taxReceiptEnabled && fbUpdateTaxReceipt(user, taxReceipt) }
            fbUpdateProductsStock(ProductSelected, user);
            dispatch(addNotification({ message: "Venta Realizada", type: 'success', title: 'Completada' }))
        } else {
            dispatch(addNotification({ message: "No se puede Facturar en Modo Demo", type: 'error' }))
        }
    } catch (err) { console.log(err) }
}

export const handleClearDataFromState = async (dispatch, viewportWidth) => {
    try {
        dispatch(CancelShipping())
        dispatch(clearTaxReceiptData())
        dispatch(deleteClient())
        if (viewportWidth < 800) dispatch(toggleCart());
    } catch (error) {
        console.log('error al borrar los datos del state de factura')
    }
}

export const createOrUpdateClient = async (dispatch, user) => {
    try {
      dispatch(handleClient({ user }))
    } catch (error) {
      console.log(error)
      dispatch(addNotification({ message: "Ocurrió un Error con el cliente, Intente de Nuevo", type: 'error' }));
    }
  }