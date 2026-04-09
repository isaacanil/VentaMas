import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { OPERATION_MODES } from '@/constants/modes';

interface ModalUpdateProdState {
  isOpen: boolean;
  prodId: string;
  data: Record<string, unknown>;
}

interface ModalToggleClientState {
  isOpen: boolean;
  mode: string;
  addClientToCart: boolean;
  data: any;
}

interface ModalToggleProviderState {
  isOpen: boolean;
  mode: string;
  data: any;
}

interface ModalToggleOrderNoteState {
  isOpen: boolean;
  data: any;
}

interface ModalToggleAddCategoryState {
  isOpen: boolean;
  data: any;
}

interface ModalToggleSignUpState {
  isOpen: boolean;
  data: any;
  businessID: string | null;
}

interface ModalFileListState {
  isOpen: boolean;
  fileList: any[];
}

interface ModalDeveloperState {
  isOpen: boolean;
  activeTab: string;
}

interface ModalState {
  modalAddClient: { isOpen: boolean };
  modalAddProd: { isOpen: boolean };
  modalUpdateProd: ModalUpdateProdState;
  modalCategory: { isOpen: boolean };
  modalAddOrder: { isOpen: boolean };
  modalAddPurchase: { isOpen: boolean };
  modalAddProvider: { isOpen: boolean };
  modalSetCustomPizza: { isOpen: boolean };
  modalToggleClient: ModalToggleClientState;
  modalToggleProvider: ModalToggleProviderState;
  modalToggleOrderNote: ModalToggleOrderNoteState;
  modalToggleAddCategory: ModalToggleAddCategoryState;
  modalToggleAddProductOutflow: { isOpen: boolean };
  modalToggleSignUp: ModalToggleSignUpState;
  modalConfirmOpenCashReconciliation: { isOpen: boolean };
  modalFileList: ModalFileListState;
  modalDeveloper: ModalDeveloperState;
  modalBilling: { isOpen: boolean }; // Added because it was used in selectors but missing in state
}

interface ModalRootState {
  modal: ModalState;
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
    prodId: '',
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
  modalBilling: {
    isOpen: false,
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
    openModalUpdateProd: (
      state: ModalState,
      actions: PayloadAction<string | void>,
    ) => {
      state.modalUpdateProd.isOpen = true;
      state.modalUpdateProd.prodId = (actions.payload as string) || '';
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
      state.modalAddOrder.isOpen = !state.modalAddOrder.isOpen;
    },
    closeModalAddOrder: (state: ModalState) => {
      state.modalAddOrder.isOpen = false;
    },
    toggleAddPurchaseModal: (state: ModalState) => {
      state.modalAddPurchase.isOpen = !state.modalAddPurchase.isOpen;
    },
    openModalAddProvider: (state: ModalState) => {
      state.modalAddProvider.isOpen = !state.modalAddProvider.isOpen;
    },
    handleModalSetCustomPizza: (state: ModalState) => {
      state.modalSetCustomPizza.isOpen = !state.modalSetCustomPizza.isOpen;
    },
    toggleClientModal: (
      state: ModalState,
      actions: PayloadAction<{
        mode: string;
        addClientToCart?: boolean;
        data?: any;
      }>,
    ) => {
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
    toggleProviderModal: (
      state: ModalState,
      actions: PayloadAction<{ mode: string; data?: any }>,
    ) => {
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
    toggleViewOrdersNotes: (
      state: ModalState,
      action: PayloadAction<{ data: any; isOpen: boolean }>,
    ) => {
      const { data, isOpen } = action.payload;
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
    toggleAddCategory: (
      state: ModalState,
      actions: PayloadAction<{ isOpen: boolean | string; data?: any }>,
    ) => {
      const { isOpen, data } = actions.payload;
      state.modalToggleAddCategory.isOpen =
        isOpen === true || (typeof isOpen === 'string' && isOpen !== 'close');

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
      state.modalToggleAddProductOutflow.isOpen =
        !state.modalToggleAddProductOutflow.isOpen;
    },
    toggleSignUpUser: (
      state: ModalState,
      action: PayloadAction<
        { data?: any; businessID?: string | null; isOpen?: boolean } | undefined
      >,
    ) => {
      if (action.payload?.data) {
        state.modalToggleSignUp.data = action.payload.data;
      }

      if (action.payload?.businessID) {
        state.modalToggleSignUp.businessID = action.payload.businessID;
      }

      if (action.payload?.isOpen === undefined) {
        state.modalToggleSignUp.isOpen = !state.modalToggleSignUp.isOpen;
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
    toggleConfirmOpenCashReconciliation: (
      state,
      _action: PayloadAction<any | void>,
    ) => {
      state.modalConfirmOpenCashReconciliation.isOpen =
        !state.modalConfirmOpenCashReconciliation.isOpen;
    },
    toggleFileListModal: (
      state: ModalState,
      action: PayloadAction<{ fileList: any[] } | undefined>,
    ) => {
      const isOpen = !state.modalFileList.isOpen;

      state.modalFileList.isOpen = isOpen;

      if (isOpen === false) {
        state.modalFileList.fileList = [];
      } else {
        state.modalFileList.fileList = action.payload?.fileList || [];
      }
    },
    toggleDeveloperModal: (
      state: ModalState,
      action: PayloadAction<{ activeTab?: string } | undefined>,
    ) => {
      const payload = action.payload;
      state.modalDeveloper.isOpen = !state.modalDeveloper.isOpen;

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

export const SelectBillingModal = (state: ModalRootState) =>
  state.modal.modalBilling.isOpen;
export const SelectAddPurchaseModal = (state: ModalRootState) =>
  state.modal.modalAddPurchase.isOpen;
export const SelectAddProdModal = (state: ModalRootState) =>
  state.modal.modalAddProd.isOpen;
export const SelectAddClientModal = (state: ModalRootState) =>
  state.modal.modalAddClient.isOpen;
export const SelectUpdateProdModal = (state: ModalRootState) =>
  state.modal.modalUpdateProd.isOpen;
export const SelectCategoryModal = (state: ModalRootState) =>
  state.modal.modalCategory.isOpen;
export const SelectAddOrderModal = (state: ModalRootState) =>
  state.modal.modalAddOrder.isOpen;
export const SelectSetCustomPizzaModal = (state: ModalRootState) =>
  state.modal.modalSetCustomPizza.isOpen;
export const SelectClientModalData = (state: ModalRootState) =>
  state.modal.modalToggleClient;
export const SelectProviderModalData = (state: ModalRootState) =>
  state.modal.modalToggleProvider;
export const SelectViewOrdersNotesModalData = (state: ModalRootState) =>
  state.modal.modalToggleOrderNote;
export const SelectAddCategoryModal = (state: ModalRootState) =>
  state.modal.modalToggleAddCategory;
export const SelectAddProductOutflowModal = (state: ModalRootState) =>
  state.modal.modalToggleAddProductOutflow;
export const SelectSignUpUserModal = (state: ModalRootState) =>
  state.modal.modalToggleSignUp;
export const SelectConfirmOpenCashReconciliationModal = (
  state: ModalRootState,
) => state.modal.modalConfirmOpenCashReconciliation;
export const SelectFileListModal = (state: ModalRootState) =>
  state.modal.modalFileList;
export const SelectDeveloperModal = (state: ModalRootState) =>
  state.modal.modalDeveloper;
export default modalSlice.reducer;
