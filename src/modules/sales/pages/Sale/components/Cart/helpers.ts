import { notification } from 'antd';
import type { InvoiceData } from '@/types/invoice';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';

import {
  addTaxReceiptInState,
  resetCart,
  toggleCart,
} from '@/features/cart/cartSlice';
import {
  deleteClient,
  handleClient,
} from '@/features/clientCart/clientCartSlice';
import {
  IncreaseEndConsumer,
  IncreaseTaxCredit,
  clearTaxReceiptData,
} from '@/features/taxReceipt/taxReceiptSlice';
import { fbAddInvoice } from '@/firebase/invoices/fbAddInvoice';

type DispatchFn = (action: unknown) => void;

type SaveToFirebaseOptions = {
  taxReceiptEnabled?: boolean;
  isSelectMode?: boolean;
  selectedProducts?: unknown[];
};

export const handleTaxReceipt = async (
  dispatch: DispatchFn,
  taxReceiptEnabled: boolean,
  ncfStatus: boolean,
) => {
  try {
    if (!taxReceiptEnabled) return;
    if (ncfStatus) {
      dispatch(IncreaseTaxCredit(undefined));
    } else {
      dispatch(IncreaseEndConsumer(undefined));
    }
  } catch (error) {
    console.error('Error in cart helper:', error);
    notification.error({
      message:
        'Ocurrió un error al manejar el comprobante fiscal. Intente de nuevo.',
    });
  }
};

export const verifyAndAdvanceTaxReceiptProcess = async (
  dispatch: DispatchFn,
  taxReceiptEnabled: boolean,
  ncfCode: string | null,
) => {
  if (taxReceiptEnabled && ncfCode === null) {
    notification.error({
      message: 'No hay comprobante fiscal seleccionado',
    });
    return;
  }
  if (taxReceiptEnabled) dispatch(addTaxReceiptInState(ncfCode));
};

export const savingDataToFirebase = async (
  dispatch: DispatchFn,
  user: UserIdentity | null | undefined,
  bill: InvoiceData,
  _taxReceipt: TaxReceiptDocument[] | null | undefined,
  options: SaveToFirebaseOptions = {},
) => {
  const {
    isSelectMode = false,
  } = options ?? {};

  try {
    if (isSelectMode) {
      await fbAddInvoice(bill, user);

      notification.success({
        message: 'Completada',
        description: 'Venta Realizada',
      });
    } else {
      notification.error({
        message: 'No se puede Facturar en Modo Demo',
      });
    }
  } catch (err) {
    console.error('Error clearing invoice state:', err);
    notification.error({
      message: 'No se pudo completar la facturación',
    });
  }
};

export const handleClearDataFromState = async (
  dispatch: DispatchFn,
  viewportWidth: number,
) => {
  try {
    dispatch(resetCart());
    dispatch(clearTaxReceiptData());
    dispatch(deleteClient());
    if (viewportWidth < 800) dispatch(toggleCart());
  } catch (error) {
    console.error('Error al borrar los datos del state de factura', error);
  }
};

export const createOrUpdateClient = async (
  dispatch: DispatchFn,
  user: UserIdentity | null | undefined,
) => {
  try {
    dispatch(handleClient({ user }));
  } catch (error) {
    console.error('Error in cart operation:', error);
    notification.error({
      message: 'Ocurrió un Error con el cliente, Intente de Nuevo',
    });
  }
};
