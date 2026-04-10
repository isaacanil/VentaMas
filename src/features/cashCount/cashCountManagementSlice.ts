import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { initialBanknotes } from './initialBanknotes';

interface CashBoxStatus {
  initialized: boolean;
  employee: any | null;
  approvalEmployee: any | null;
  date: any | null;
  banknotes: any;
  banknotesTotal: number;
  banknotesAmount: number;
  comments: string | null;
  totals?: any;
}

interface CashCountState {
  cashAccountId?: string | null;
  state: string | null;
  opening: CashBoxStatus;
  closing: CashBoxStatus;
  sales: any[];
  receivablePayments: any[];
  totalCard: number;
  totalTransfer: number;
  totalCharged: number;
  totalReceivables: number;
  totalDiscrepancy: number;
  totalRegister: number;
  totalSystem: number;
  updatedAt?: any | null;
  createdAt?: any | null;
  id?: string | null;
  incrementNumber?: number | null;
}

interface CashCountManagementRootState {
  cashCountManagement: CashCountState;
}

const initialCashBoxStatus: CashBoxStatus = {
  initialized: false,
  employee: null,
  approvalEmployee: null,
  date: null,
  banknotes: initialBanknotes,
  banknotesTotal: 0.0,
  banknotesAmount: 0,
  comments: null,
};

const initialCashCount: CashCountState = {
  cashAccountId: null,
  state: null,
  opening: initialCashBoxStatus,
  closing: initialCashBoxStatus,
  sales: [],
  receivablePayments: [], // Added for AR integration
  totalCard: 0,
  totalTransfer: 0,
  totalCharged: 0,
  totalReceivables: 0, // Added for AR integration
  totalDiscrepancy: 0,
  totalRegister: 0,
  totalSystem: 0,
};

const cashCountManagementSlice = createSlice({
  name: 'cashCountManagement',
  initialState: initialCashCount,
  reducers: {
    updateCashCountTotals: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      const {
        totalCard,
        totalTransfer,
        totalCharged,
        totalReceivables,
        totalDiscrepancy,
        totalRegister,
        totalSystem,
      } = action.payload;
      state.totalCard = totalCard || 0;
      state.totalTransfer = totalTransfer || 0;
      state.totalCharged = totalCharged || 0;
      state.totalReceivables = totalReceivables || 0;
      state.totalDiscrepancy = totalDiscrepancy || 0;
      state.totalRegister = totalRegister || 0;
      state.totalSystem = totalSystem || 0;
    },
    setCashCountOpeningBanknotes: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.opening.banknotes = action.payload;
      state.opening.banknotesAmount = calculateTotalAmount(
        state.opening.banknotes,
      );
      state.opening.banknotesTotal = state.opening.banknotes.reduce(
        (acc: number, curr: any) => acc + curr.value * curr.quantity,
        0,
      );
    },
    setCashCountOpeningEmployee: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.opening.employee = action.payload;
    },
    setCashCountOpeningDate: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.opening.date = action.payload;
    },
    setCashCountOpeningComments: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.opening.comments = action.payload;
    },
    setCashCountOpening: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.opening = action.payload;
    },
    setCashCountClosingBanknotes: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.closing.banknotes = action.payload;
      state.closing.banknotesAmount = calculateTotalAmount(
        state.closing.banknotes,
      );
      state.closing.banknotesTotal = state.closing.banknotes.reduce(
        (acc: number, curr: any) => acc + curr.value * curr.quantity,
        0,
      );
    },
    setCashCountClosingComments: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.closing.comments = action.payload;
    },
    addPropertiesToCashCount: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      Object.assign(state, action.payload);
    },
    setCashCountSales: (
      state: CashCountState,
      action: PayloadAction<any[]>,
    ) => {
      state.sales = action.payload;
    },
    setClosingCashTotalAndDiscrepancy: (
      state: CashCountState,
      action: PayloadAction<any>,
    ) => {
      state.closing.totals = action.payload;
    },
    setCashCount: (_state, action: PayloadAction<CashCountState>) => {
      return action.payload;
    },
    clearCashCount: (state: CashCountState) => {
      state.opening = initialCashBoxStatus;
      state.closing = initialCashBoxStatus;
      state.totalCard = 0;
      state.totalTransfer = 0;
      state.totalCharged = 0;
      state.totalReceivables = 0;
      state.totalDiscrepancy = 0;
      state.totalRegister = 0;
      state.totalSystem = 0;
      state.updatedAt = null;
      state.createdAt = null;
      state.sales = [];
      state.receivablePayments = [];
      state.cashAccountId = null;
      state.state = null;
      state.id = null;
      state.incrementNumber = null;
    },
  },
});

function calculateTotalAmount(banknotesByCurrency: any[]) {
  let total = banknotesByCurrency.reduce((acc, curr) => acc + curr.quantity, 0);

  return Number(total);
}

export const {
  addPropertiesToCashCount,
  setCashCountOpening,
  setCashCountOpeningBanknotes,
  setCashCountOpeningEmployee,
  setCashCountOpeningDate,
  setCashCountOpeningComments,
  setCashCountClosingBanknotes,
  setCashCountClosingComments,
  setCashCountSales,
  updateCashCountTotals,
  setCashCount,
  clearCashCount,
  setClosingCashTotalAndDiscrepancy,
} = cashCountManagementSlice.actions;

export default cashCountManagementSlice.reducer;

export const selectCashCount = (state: CashCountManagementRootState) =>
  state.cashCountManagement;
