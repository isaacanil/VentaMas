import { notification } from 'antd';
import { resetCart, toggleCart } from "../../../features/cart/cartSlice";
import { deleteClient, handleClient } from "../../../features/clientCart/clientCartSlice";
import { IncreaseEndConsumer, IncreaseTaxCredit, clearTaxReceiptData } from "../../../features/taxReceipt/taxReceiptSlice";
import { selectAppMode } from "../../../features/appModes/appModeSlice";
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
        console.error('Error in cart helper:', error);
        notification.error({
            message: "Ocurrió un error al manejar el comprobante fiscal. Intente de nuevo."
        });
    }
};

export const verifyAndAdvanceTaxReceiptProcess = async (dispatch, taxReceiptEnabled, ncfCode) => {
    if (taxReceiptEnabled && ncfCode === null) {
        notification.error({
            message: "No hay comprobante fiscal seleccionado"
        });
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
            notification.success({
                message: 'Completada',
                description: 'Venta Realizada'
            });
        } else {
            notification.error({
                message: "No se puede Facturar en Modo Demo"
            });
        }
    } catch (err) { console.error('Error clearing invoice state:', err) }
}

export const handleClearDataFromState = async (dispatch, viewportWidth) => {
    try {
        dispatch(resetCart())
        dispatch(clearTaxReceiptData())
        dispatch(deleteClient())
        if (viewportWidth < 800) dispatch(toggleCart());
    } catch (error) {
        console.error('Error al borrar los datos del state de factura')
    }
}

export const createOrUpdateClient = async (dispatch, user) => {
    try {
      dispatch(handleClient({ user }))
    } catch (error) {
              console.error('Error in cart operation:', error)
      notification.error({
          message: "Ocurrió un Error con el cliente, Intente de Nuevo"
      });
    }
  }