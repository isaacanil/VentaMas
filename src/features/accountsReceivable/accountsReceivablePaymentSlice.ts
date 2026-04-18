import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { getLastInstallmentAmountByArId } from '@/firebase/accountsReceivable/installment/getLastInstallmentAmountByArId';
import type { AccountsReceivableInstallment } from '@/utils/accountsReceivable/types';
import type { CreditNoteSelection } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

interface AccountsReceivablePaymentMethod {
  method: string;
  value: number;
  status: boolean;
  reference?: string;
  bankAccountId?: string | null;
  name?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface CreditNotePayment {
  id: string;
  ncf: string;
  amountUsed: number;
  originalAmount: number;
}

interface ThirdPartyWithholding {
  retentionDate: string;
  itbisWithheld: number;
  incomeTaxWithheld: number;
}

interface PaymentDetails {
  paymentScope: string;
  paymentOption: string;
  clientId: string;
  arId: string;
  paymentMethods: AccountsReceivablePaymentMethod[];
  comments: string;
  totalAmount: number;
  totalPaid: number;
  printReceipt: boolean;
  creditNotePayment: CreditNotePayment[];
  thirdPartyWithholding?: ThirdPartyWithholding | null;
  originType?: string;
  originId?: string;
  preorderId?: string;
  originStage?: string;
  createdFrom?: string;
  balance?: number;
}

interface PaymentExtra {
  arBalance?: number;
  installmentAmount?: number;
  originType?: string | null;
  originId?: string | null;
  preorderId?: string | null;
  invoiceId?: string | null;
  [key: string]: unknown;
}

interface AccountsReceivablePaymentState {
  isOpen: boolean;
  paymentDetails: PaymentDetails;
  error: string | null;
  isValid: boolean;
  methodErrors: Record<string, string | null>;
  extra: PaymentExtra | null;
  installment: AccountsReceivableInstallment | null;
}

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const calculateTotalPaid = (
  paymentMethods: AccountsReceivablePaymentMethod[],
): number =>
  roundCurrency(
    paymentMethods.reduce((sum, method) => {
      if (!method.status) return sum;
      return sum + (Number(method.value) || 0);
    }, 0),
  );

interface SetAccountPaymentPayload {
  isOpen?: boolean;
  paymentDetails?: Partial<PaymentDetails>;
  error?: string | null;
  isValid?: boolean;
  methodErrors?: Record<string, string | null>;
  extra?: PaymentExtra | null;
}

const paymentDetailsTemplate: PaymentDetails = {
  paymentScope: 'balance', // Tipo de pago (cuota, balance de cuenta, abono) account
  paymentOption: 'installment', // Subtipo de pago ('cuota', 'abono' cuando tipo es 'cuenta')
  clientId: '', // ID del cliente
  arId: '', // ID de la cuenta por cobrar
  paymentMethods: [
    {
      method: 'cash',
      value: 0,
      status: true,
    },
    {
      method: 'card',
      value: 0,
      bankAccountId: null,
      reference: '',
      status: false,
    },
    {
      method: 'transfer',
      value: 0,
      bankAccountId: null,
      reference: '',
      status: false,
    },
    {
      method: 'creditNote',
      value: 0,
      status: false,
    },
  ],
  comments: '', // Comentarios
  totalAmount: 0.0, // Monto total a pagar
  totalPaid: 0.0, // Monto total pagado
  printReceipt: true, // Si se debe imprimir el recibo de pago
  creditNotePayment: [], // Notas de crédito aplicadas
  thirdPartyWithholding: null,
};

const createDefaultPaymentDetails = (amount = 0): PaymentDetails => {
  const normalizedAmount = roundCurrency(Number(amount) || 0);
  const methods = paymentDetailsTemplate.paymentMethods.map((method) => ({
    ...method,
  }));

  // Prefill cash with the amount to pay; keep others off
  const cashIndex = methods.findIndex((m) => m.method === 'cash');
  if (cashIndex !== -1) {
    methods[cashIndex] = {
      ...methods[cashIndex],
      value: normalizedAmount,
      status: normalizedAmount > 0,
    };
  }

  return {
    ...paymentDetailsTemplate,
    totalAmount: normalizedAmount,
    totalPaid: normalizedAmount > 0 ? normalizedAmount : 0,
    paymentMethods: methods,
    creditNotePayment: [],
    thirdPartyWithholding: null,
  };
};

const initialState: AccountsReceivablePaymentState = {
  isOpen: false,
  paymentDetails: createDefaultPaymentDetails(),
  error: null, // Para manejar errores
  isValid: true, // Para manejar validaciones
  methodErrors: {},
  extra: null, // Para manejar información adicional
  installment: null,
};

// Thunk to fetch last installment amount
export const fetchLastInstallmentAmount = createAsyncThunk<
  { arId: string; lastInstallmentAmount: number },
  { user: UserIdentity; arId: string },
  { rejectValue: string }
>(
  'accountsReceivablePayment/fetchLastInstallmentAmount',
  async ({ user, arId }, { rejectWithValue }) => {
    try {
      const lastInstallmentAmount = await getLastInstallmentAmountByArId(
        user,
        arId,
      );
      return { arId, lastInstallmentAmount };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'No se pudo obtener el monto de la última cuota.',
      );
    }
  },
);

const accountsReceivablePaymentSlice = createSlice({
  name: 'accountsReceivablePayment',
  initialState,
  reducers: {
    openPaymentModal: (state: AccountsReceivablePaymentState) => {
      state.isOpen = true;
    },
    closePaymentModal: (state: AccountsReceivablePaymentState) => {
      state.isOpen = false;
      state.paymentDetails = createDefaultPaymentDetails();
      state.error = null;
      state.isValid = true;
      state.methodErrors = {};
      state.extra = null;
    },
    setPaymentDetails: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<Partial<PaymentDetails>>,
    ) => {
      state.paymentDetails = {
        ...state.paymentDetails,
        ...action.payload,
      };
    },
    setPaymentOption: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<{ paymentOption: string }>,
    ) => {
      const { paymentOption } = action.payload;
      state.paymentDetails.paymentOption = paymentOption;
      if (
        state.paymentDetails.paymentScope === 'account' &&
        state.paymentDetails.paymentOption === 'installment'
      ) {
        state.paymentDetails.totalAmount =
          (state.extra?.installmentAmount as number) ??
          state.paymentDetails.totalAmount;
      } else if (state.paymentDetails.paymentScope === 'account') {
        state.paymentDetails.totalAmount =
          (state.extra?.arBalance as number) ??
          state.paymentDetails.totalAmount;
      }
    },
    setAccountPayment: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<SetAccountPaymentPayload>,
    ) => {
      const {
        isOpen,
        paymentDetails: paymentDetailsPayload,
        error,
        isValid,
        methodErrors,
        extra,
      } = action.payload;
      const opening = isOpen === true && state.isOpen === false;

      if (opening) {
        const incomingAmount =
          paymentDetailsPayload?.totalAmount ??
          (paymentDetailsPayload as any)?.balance ??
          (state.extra?.installmentAmount as number) ??
          0;
        state.paymentDetails = createDefaultPaymentDetails(incomingAmount);
        state.methodErrors = {};
        state.error = null;
        state.isValid = true;
      }

      if (isOpen !== undefined) state.isOpen = isOpen;
      if (paymentDetailsPayload !== undefined) {
        state.paymentDetails = {
          ...state.paymentDetails,
          ...paymentDetailsPayload,
          paymentMethods:
            paymentDetailsPayload.paymentMethods ||
            state.paymentDetails.paymentMethods,
        };
      }
      if (extra !== undefined) state.extra = extra;
      if (error !== undefined) state.error = error;
      if (isValid !== undefined) state.isValid = isValid;
      if (methodErrors !== undefined) state.methodErrors = methodErrors;
      if (
        state.paymentDetails.paymentScope === 'account' &&
        state.paymentDetails.paymentOption === 'installment'
      ) {
        state.paymentDetails.totalAmount =
          (state.extra?.installmentAmount as number) ||
          state.paymentDetails.totalAmount;
      } else if (paymentDetailsPayload?.totalAmount !== undefined) {
        state.paymentDetails.totalAmount = paymentDetailsPayload.totalAmount;
      }

      // Inferir metadata de preventa desde `extra` para que la auto-conversión
      // funcione de forma consistente sin importar desde qué pantalla se abre.
      const mergedExtra = (state.extra ?? {}) as PaymentExtra;
      if (state.paymentDetails.paymentScope === 'account') {
        const inferredOriginType =
          (typeof mergedExtra.originType === 'string' &&
            mergedExtra.originType) ||
          state.paymentDetails.originType;
        const inferredOriginId =
          (typeof mergedExtra.originId === 'string' && mergedExtra.originId) ||
          state.paymentDetails.originId;
        const inferredPreorderId =
          (typeof mergedExtra.preorderId === 'string' &&
            mergedExtra.preorderId) ||
          (inferredOriginType === 'preorder'
            ? inferredOriginId ||
              (typeof mergedExtra.invoiceId === 'string'
                ? mergedExtra.invoiceId
                : null)
            : null) ||
          state.paymentDetails.preorderId;

        if (inferredOriginType) {
          state.paymentDetails.originType = inferredOriginType;
        }
        if (inferredOriginId) {
          state.paymentDetails.originId = inferredOriginId;
        }
        if (inferredPreorderId) {
          state.paymentDetails.preorderId = inferredPreorderId;
        }
      }

      // Recalcular total pagado con los métodos vigentes
      state.paymentDetails.totalPaid = state.paymentDetails.paymentMethods
        ? calculateTotalPaid(state.paymentDetails.paymentMethods)
        : 0.0;
    },
    updatePaymentMethod: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<{
        method: string;
        key: string;
        value: string | number | boolean | null;
      }>,
    ) => {
      const { method, key, value } = action.payload;
      const methodIndex = state.paymentDetails.paymentMethods.findIndex(
        (m) => m.method === method,
      );
      if (methodIndex !== -1) {
        const paymentMethod = state.paymentDetails.paymentMethods[methodIndex];

        // Si la clave es 'reference' y el método es 'cash' o 'creditNote', no asignar el valor
        if (
          !(
            key === 'reference' &&
            (method === 'cash' || method === 'creditNote')
          )
        ) {
          (paymentMethod as any)[key] = value;
        }
        // Recalculate totalPaid only if the method is active
        state.paymentDetails.totalPaid = calculateTotalPaid(
          state.paymentDetails.paymentMethods,
        );
      }
    },
    setError: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
    },
    setIsValid: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<boolean>,
    ) => {
      state.isValid = action.payload;
    },
    setMethodError: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<{
        method: string;
        key: string;
        error: string | null;
      }>,
    ) => {
      const { method, key, error } = action.payload;
      state.methodErrors[`${method}_${key}`] = error;
    },
    clearMethodErrors: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<{ method: string }>,
    ) => {
      const { method } = action.payload;
      delete state.methodErrors[`${method}_value`];
      delete state.methodErrors[`${method}_reference`];
      delete state.methodErrors[`${method}_bankAccountId`];
    },
    setCreditNotePayment: (
      state: AccountsReceivablePaymentState,
      action: PayloadAction<CreditNoteSelection[] | null | undefined>,
    ) => {
      const creditNoteSelections = action.payload || [];

      // Calcular total aplicado
      const totalCreditNoteAmount = creditNoteSelections.reduce(
        (sum, sel) => sum + Number(sel.amountToUse ?? sel.amountUsed ?? 0),
        0,
      );

      // Calcular total de otros métodos activos
      const totalOtherPayments = state.paymentDetails.paymentMethods
        .filter((m) => m.status && m.method !== 'creditNote')
        .reduce((sum, m) => sum + (Number(m.value) || 0), 0);

      const totalDue = state.paymentDetails.totalAmount || 0;
      const remainingToPay = Math.max(0, totalDue - totalOtherPayments);
      const validAmount = Math.min(totalCreditNoteAmount, remainingToPay);

      // Transformar y guardar detalle en paymentDetails con estructura estandarizada
      state.paymentDetails.creditNotePayment = creditNoteSelections
        .map((sel) => {
          const rawId = sel.id;
          const amountUsed = Number(sel.amountToUse ?? sel.amountUsed ?? 0);
          const id =
            typeof rawId === 'string' || typeof rawId === 'number'
              ? String(rawId)
              : '';

          return {
            id,
            ncf: sel.creditNote?.ncf || sel.creditNote?.number || '',
            amountUsed,
            originalAmount: Number(sel.creditNote?.totalAmount ?? 0),
          };
        })
        .filter((sel) => sel.id.length > 0 && sel.amountUsed > 0);

      // Actualizar método de pago creditNote
      const idx = state.paymentDetails.paymentMethods.findIndex(
        (m) => m.method === 'creditNote',
      );
      if (idx !== -1) {
        state.paymentDetails.paymentMethods[idx] = {
          ...state.paymentDetails.paymentMethods[idx],
          value: validAmount,
          status: validAmount > 0,
        };
      } else {
        state.paymentDetails.paymentMethods.push({
          method: 'creditNote',
          name: 'Notas de Crédito',
          value: validAmount,
          status: validAmount > 0,
        });
      }

      // Recalcular totalPaid
      state.paymentDetails.totalPaid = calculateTotalPaid(
        state.paymentDetails.paymentMethods,
      );
    },
    clearCreditNotePayment: (state: AccountsReceivablePaymentState) => {
      state.paymentDetails.creditNotePayment = [];
      const idx = state.paymentDetails.paymentMethods.findIndex(
        (m) => m.method === 'creditNote',
      );
      if (idx !== -1) {
        state.paymentDetails.paymentMethods[idx] = {
          ...state.paymentDetails.paymentMethods[idx],
          value: 0,
          status: false,
        };
      }
      state.paymentDetails.totalPaid = calculateTotalPaid(
        state.paymentDetails.paymentMethods,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchLastInstallmentAmount.fulfilled,
        (state: AccountsReceivablePaymentState, action) => {
          const { arId, lastInstallmentAmount } = action.payload;
          if (state.paymentDetails.arId === arId) {
            state.extra = {
              ...(state.extra ?? {}),
              installmentAmount: lastInstallmentAmount,
            };
            if (state.paymentDetails.paymentOption === 'installment') {
              state.paymentDetails.totalAmount = lastInstallmentAmount;
            }
          }
        },
      )
      .addCase(
        fetchLastInstallmentAmount.rejected,
        (state: AccountsReceivablePaymentState, action) => {
          state.error = action.payload ?? 'Error desconocido';
        },
      );
  },
});

export const {
  openPaymentModal,
  closePaymentModal,
  setPaymentDetails,
  setAccountPayment,
  setPaymentOption,
  updatePaymentMethod,
  setError,
  setIsValid,
  setMethodError,
  clearMethodErrors,
  setCreditNotePayment,
  clearCreditNotePayment,
} = accountsReceivablePaymentSlice.actions;

export default accountsReceivablePaymentSlice.reducer;

type AccountsReceivablePaymentRootState = {
  accountsReceivablePayment: AccountsReceivablePaymentState;
};

export const selectAccountsReceivablePayment = (
  state: AccountsReceivablePaymentRootState,
) => state.accountsReceivablePayment;
