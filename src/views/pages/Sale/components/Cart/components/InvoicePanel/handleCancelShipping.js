import { resetCart, toggleCart, toggleInvoicePanel } from '../../../../../../../features/cart/cartSlice';
import { deleteClient } from '../../../../../../../features/clientCart/clientCartSlice';
import { clearAuthData } from '../../../../../../../features/insurance/insuranceAuthSlice';
import { clearTaxReceiptData } from '../../../../../../../features/taxReceipt/taxReceiptSlice';

export function handleCancelShipping({ dispatch, viewport, closeInvoicePanel = true, clearTaxReceipt = false }) {
    if (!dispatch) return;
    if (viewport !== undefined && viewport <= 800) dispatch(toggleCart());
    if (closeInvoicePanel) dispatch(toggleInvoicePanel());
    dispatch(resetCart());
    if (clearTaxReceipt) {
        dispatch(clearTaxReceiptData());
    }
    dispatch(deleteClient());
    dispatch(clearAuthData());
}

