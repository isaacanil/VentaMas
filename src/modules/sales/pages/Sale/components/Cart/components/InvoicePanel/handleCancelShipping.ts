import {
  resetCart,
  toggleCart,
  toggleInvoicePanel,
} from '@/features/cart/cartSlice';
import { deleteClient } from '@/features/clientCart/clientCartSlice';
import { clearAuthData } from '@/features/insurance/insuranceAuthSlice';
import { clearTaxReceiptData } from '@/features/taxReceipt/taxReceiptSlice';

type DispatchFn = (action: unknown) => void;

type HandleCancelShippingOptions = {
  dispatch?: DispatchFn | null;
  viewport?: number;
  closeInvoicePanel?: boolean;
  clearTaxReceipt?: boolean;
};

export function handleCancelShipping({
  dispatch,
  viewport,
  closeInvoicePanel = true,
  clearTaxReceipt = false,
}: HandleCancelShippingOptions) {
  if (!dispatch) return;
  if (viewport !== undefined && viewport <= 800) dispatch(toggleCart(undefined));
  if (closeInvoicePanel) dispatch(toggleInvoicePanel(undefined));
  dispatch(resetCart(undefined));
  if (clearTaxReceipt) {
    dispatch(clearTaxReceiptData());
  }
  dispatch(deleteClient());
  dispatch(clearAuthData());
}
