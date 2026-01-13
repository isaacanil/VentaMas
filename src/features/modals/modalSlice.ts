import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { OPERATION_MODES } from '@/constants/modes';

interface ModalState {
  modalAddClient: { isOpen: boolean };
  modalAddProd: { isOpen: boolean };
  modalUpdateProd: { isOpen: boolean; id: string; data: Record<string, unknown> };
  modalCategory: { isOpen: boolean };
  modalAddOrder: { isOpen: boolean };
  modalAddPurchase: { isOpen: boolean };
  modalAddProvider: { isOpen: boolean };
  modalSetCustomPizza: { isOpen: boolean };
  modalToggleClient: { isOpen: boolean; mode: string; addClientToCart: boolean; data: any };
  modalToggleProvider: { isOpen: boolean; mode: string; data: any };
  modalToggleOrderNote: { isOpen: boolean; data: any };
  modalToggleAddCategory: { isOpen: boolean; data: any };
  modalToggleAddProductOutflow: { isOpen: boolean };
  modalToggleSignUp: { isOpen: boolean; data: any; businessID: string | null };
  modalConfirmOpenCashReconciliation: { isOpen: boolean };
  modalFileList: { isOpen: boolean; fileList: any[] };
  modalDeveloper: { isOpen: boolean; activeTab: string };
}

const initialState: ModalState = {
  modalAddClient: {
    isOpen: false,
  },
  modalAddProd: {
    isOpen: false,
  },
  modalUpdateProd: {
    isOpen: false,
    id: '',
    data: {},
  },
  modalCategory: {
    isOpen: false,
  },
  modalAddOrder: {
    isOpen: false,
  },
  modalAddPurchase: {
    isOpen: false,
  },
  modalAddProvider: {
    isOpen: false,
  },
  modalSetCustomPizza: {
    isOpen: false,
  },
  modalToggleClient: {
    isOpen: false,
    mode: 'create',
    addClientToCart: false,
    data: null,
  },
  modalToggleProvider: {
    isOpen: false,
    mode: 'create',
    data: null,
  },
  modalToggleOrderNote: {
    isOpen: false,
    data: null,
  },
  modalToggleAddCategory: {
    isOpen: false,
    data: null,
  },
  modalToggleAddProductOutflow: {
    isOpen: false,
  },
  modalToggleSignUp: {
    isOpen: false,
    data: null,
    businessID: null,
  },
  modalConfirmOpenCashReconciliation: {
    isOpen: false,
  },
  modalFileList: {
    isOpen: false,
    fileList: [],
  },
  modalDeveloper: {
    isOpen: false,
    activeTab: 'console',
  },
};
const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModalAddClient: (state: ModalState) => {
      state.modalAddClient.isOpen = true;
    },
    closeModalAddClient: (state: ModalState) => {
      state.modalAddClient.isOpen = false;
    },
    openModalAddProd: (state: ModalState) => {
      state.modalAddProd.isOpen = true;
    },
    closeModalAddProd: (state: ModalState) => {
      state.modalAddProd.isOpen = false;
    },
    openModalUpdateProd: (state: ModalState, actions: PayloadAction<any | void>) => {
      state.modalUpdateProd.isOpen = true;
      state.modalUpdateProd.prodId = actions.payload || '';
    },
    closeModalUpdateProd: (state: ModalState) => {
      state.modalUpdateProd.isOpen = false;
      state.modalUpdateProd.prodId = '';
      state.modalUpdateProd.data = {};
    },
    openModalCategory: (state: ModalState) => {
      state.modalCategory.isOpen = true;
    },
    closeModalCategory: (state: ModalState) => {
      state.modalCategory.isOpen = false;
    },
    openModalAddOrder: (state: ModalState) => {
      let isOpen = state.modalAddOrder.isOpen;
      state.modalAddOrder.isOpen = !isOpen;
    },
    closeModalAddOrder: (state: ModalState) => {
      state.modalAddOrder.isOpen = false;
    },
    toggleAddPurchaseModal: (state: ModalState) => {
      let isOpen = state.modalAddPurchase.isOpen;
      state.modalAddPurchase.isOpen = !isOpen;
    },
    openModalAddProvider: (state: ModalState) => {
      let isOpen = state.modalAddOrder.isOpen;
      state.modalAddProvider.isOpen = !isOpen;
    },
    handleModalSetCustomPizza: (state: ModalState) => {
      let isOpen = state.modalSetCustomPizza.isOpen;
      state.modalSetCustomPizza.isOpen = !isOpen;
    },
    toggleClientModal: (state: ModalState, actions: PayloadAction<any>) => {
      // const mode = actions.payload.mode

      const { mode, addClientToCart } = actions.payload;
      let isOpen = state.modalToggleClient.isOpen;
      state.modalToggleClient.isOpen = !isOpen;
      if (isOpen === false) {
        state.modalToggleClient.mode = OPERATION_MODES.CREATE.id;
        state.modalToggleClient.data = null;
      }
      if (addClientToCart) {
        state.modalToggleClient.addClientToCart = addClientToCart;
      }
      if (mode === OPERATION_MODES.CREATE.id) {
        state.modalToggleClient.mode = mode;
        state.modalToggleClient.data = null;
        return;
      }
      if (mode === OPERATION_MODES.UPDATE.id) {
        state.modalToggleClient.mode = mode;
        state.modalToggleClient.data = actions.payload.data;
        return;
      }
    },
    toggleProviderModal: (state: ModalState, actions: PayloadAction<any>) => {
      const create = OPERATION_MODES.CREATE.id;
      const update = OPERATION_MODES.UPDATE.id;

      const mode = actions.payload.mode;
      let isOpen = state.modalToggleProvider.isOpen;
      state.modalToggleProvider.isOpen = !isOpen;
      if (isOpen === false) {
        state.modalToggleProvider.mode = create;
        state.modalToggleProvider.data = null;
      }
      if (mode === create) {
        state.modalToggleProvider.mode = mode;
        state.modalToggleProvider.data = null;
        return;
      }
      if (mode === update) {
        state.modalToggleProvider.mode = mode;
        state.modalToggleProvider.data = actions.payload.data;
        return;
      }
    },
    toggleViewOrdersNotes: (state: ModalState, actions: PayloadAction<any>) => {
      const { data, isOpen } = actions.payload;
      state.modalToggleOrderNote.isOpen = !isOpen;

      if (isOpen === false) {
        state.modalToggleOrderNote.data = null;
        return;
      }
      if (data !== null && data !== false && isOpen === true) {
        state.modalToggleOrderNote.data = data;
        state.modalToggleOrderNote.isOpen = true;
        if (data == null || data == false) {
          state.modalToggleOrderNote.isOpen = false;
          state.modalToggleOrderNote.data = null;
          return;
        }
        return;
      }
    },
    toggleAddCategory: (state: ModalState, actions: PayloadAction<any>) => {
      const { isOpen, data } = actions.payload;
      state.modalToggleAddCategory.isOpen = isOpen;

      if (isOpen === 'close') {
        state.modalToggleAddCategory.isOpen = false;
      }
      if (data) {
        state.modalToggleAddCategory.data = data;
      }
      if (data === null) {
        state.modalToggleAddCategory.data = null;
      }
    },
    toggleAddProductOutflow: (state, _actions: PayloadAction<any | void>) => {
      const isOpen = state.modalToggleAddProductOutflow.isOpen;
      state.modalToggleAddProductOutflow.isOpen = !isOpen;
    },
    toggleSignUpUser: (state: ModalState, action: PayloadAction<any>) => {
      if (action.payload?.data) {
        state.modalToggleSignUp.data = action.payload.data;
      }

      if (action.payload?.businessID) {
        state.modalToggleSignUp.businessID = action.payload.businessID;
      }

      if (action.payload?.isOpen === undefined) {
        const isOpen = state.modalToggleSignUp.isOpen;
        state.modalToggleSignUp.isOpen = !isOpen;
        return;
      }
      if (action.payload?.isOpen === false) {
        state.modalToggleSignUp.isOpen = false;
        state.modalToggleSignUp.data = null;
        state.modalToggleSignUp.businessID = null;
        return;
      }
      if (action.payload?.isOpen === true) {
        state.modalToggleSignUp.isOpen = true;
        return;
      }
    },
    toggleConfirmOpenCashReconciliation: (state, _action: PayloadAction<any | void>) => {
      const isOpen = state.modalConfirmOpenCashReconciliation.isOpen;
      state.modalConfirmOpenCashReconciliation.isOpen = !isOpen;
    },
    toggleFileListModal: (state: ModalState, action: PayloadAction<any>) => {
      const isOpen = !state.modalFileList.isOpen;

      state.modalFileList.isOpen = isOpen;

      if (isOpen === false) {
        state.modalFileList.fileList = [];
      } else {
        state.modalFileList.fileList = action.payload?.fileList || [];
      }
    },
    toggleDeveloperModal: (state: ModalState, action: PayloadAction<any>) => {
      const payload = action.payload;
      const isOpen = !state.modalDeveloper.isOpen;

      state.modalDeveloper.isOpen = isOpen;

      if (payload?.activeTab) {
        state.modalDeveloper.activeTab = payload.activeTab;
      }
    },
  },
});
export const {
  openModalAddClient,
  closeModalAddClient,
  openModalAddProd,
  closeModalAddProd,
  openModalAddOrder,
  closeModalAddOrder,
  openModalUpdateProd,
  closeModalUpdateProd,
  openModalCategory,
  closeModalCategory,
  openModalAddProvider,
  handleModalSetCustomPizza,
  toggleAddPurchaseModal,
  toggleProviderModal,
  toggleClientModal,
  toggleViewOrdersNotes,
  toggleAddCategory,
  toggleAddProductOutflow,
  toggleSignUpUser,
  toggleConfirmOpenCashReconciliation,
  toggleFileListModal,
  toggleDeveloperModal,
} = modalSlice.actions;

export const SelectBillingModal = (state: { modal: ModalState }) => state.modal.modalBilling.isOpen;
export const SelectAddPurchaseModal = (state: { modal: ModalState }) =>
  state.modal.modalAddPurchase.isOpen;
export const SelectAddProdModal = (state: { modal: ModalState }) => state.modal.modalAddProd.isOpen;
export const SelectAddClientModal = (state: { modal: ModalState }) =>
  state.modal.modalAddClient.isOpen;
export const SelectUpdateProdModal = (state: { modal: ModalState }) =>
  state.modal.modalUpdateProd.isOpen;
export const SelectCategoryModal = (state: { modal: ModalState }) => state.modal.modalCategory.isOpen;
export const SelectAddOrderModal = (state: { modal: ModalState }) => state.modal.modalAddOrder.isOpen;
export const SelectSetCustomPizzaModal = (state: { modal: ModalState }) =>
  state.modal.modalSetCustomPizza.isOpen;
export const SelectClientModalData = (state: { modal: ModalState }) => state.modal.modalToggleClient;
export const SelectProviderModalData = (state: { modal: ModalState }) =>
  state.modal.modalToggleProvider;
export const SelectViewOrdersNotesModalData = (state: { modal: ModalState }) =>
  state.modal.modalToggleOrderNote;
export const SelectAddCategoryModal = (state: { modal: ModalState }) =>
  state.modal.modalToggleAddCategory;
export const SelectAddProductOutflowModal = (state: { modal: ModalState }) =>
  state.modal.modalToggleAddProductOutflow;
export const SelectSignUpUserModal = (state: { modal: ModalState }) => state.modal.modalToggleSignUp;
export const SelectConfirmOpenCashReconciliationModal = (state: { modal: ModalState }) =>
  state.modal.modalConfirmOpenCashReconciliation;
export const SelectFileListModal = (state: { modal: ModalState }) => state.modal.modalFileList;
export const SelectDeveloperModal = (state: { modal: ModalState }) => state.modal.modalDeveloper;
export default modalSlice.reducer;




