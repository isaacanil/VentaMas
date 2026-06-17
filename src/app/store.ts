import { configureStore } from '@reduxjs/toolkit';

import abilitiesReducer from '@/features/abilities/abilitiesSlice';
import accountsReceivablePaymentReducer from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import accountsReceivableReducer from '@/features/accountsReceivable/accountsReceivableSlice';
import activeIngredientsReducer from '@/features/activeIngredients/activeIngredientsSlice';
import addOrderReducer from '@/features/addOrder/addOrderSlice';
import alertReducer from '@/features/Alert/AlertSlice';
import appReducer from '@/features/appModes/appModeSlice';
import businessReducer from '@/features/auth/businessSlice';
import userReducer from '@/features/auth/userSlice';
import barcodePrintModalReducer from '@/features/barcodePrintModalSlice/barcodePrintModalSlice';
import cartReducer from '@/features/cart/cartSlice';
import cashCountManagementReducer from '@/features/cashCount/cashCountManagementSlice';
import cashCountState from '@/features/cashCount/cashStateSlice';
import categoryReducer from '@/features/category/categorySlice';
import clientCartReducer from '@/features/clientCart/clientCartSlice';
import creditNoteModalReducer from '@/features/creditNote/creditNoteModalSlice';
import customProductReducer from '@/features/customProducts/customProductSlice';
import doctorsReducer from '@/features/doctors/doctorsSlice';
import expenseManagement from '@/features/expense/expenseManagementSlice';
import expensesList from '@/features/expense/expensesListSlice';
import expenseUI from '@/features/expense/expenseUISlice';
import fileReducer from '@/features/files/fileSlice';
import filterProductsSliceReducer from '@/features/filterProduct/filterProductsSlice';
import viewerImageReducer from '@/features/imageViewer/imageViewerSlice';
import insuranceAccountsReceivableReducer from '@/features/insurance/insuranceAccountsReceivableSlice';
import insuranceAuthReducer from '@/features/insurance/insuranceAuthSlice';
import insuranceConfigModalReducer from '@/features/insurance/insuranceConfigModalSlice';
import insuranceReducer from '@/features/insurance/insuranceSlice';
import invoiceFormReducer from '@/features/invoice/invoiceFormSlice';
import invoicePreviewReducer from '@/features/invoice/invoicePreviewSlice';
import invoiceWorkspaceModalReducer from '@/features/invoice/invoiceWorkspaceModalSlice';
import loaderReducer from '@/features/loader/loaderSlice';
import modalReducer from '@/features/modals/modalSlice';
import navReducer from '@/features/nav/navSlice';
import navigationReducer from '@/features/navigation/navigationSlice';
import noteModalReducer from '@/features/noteModal/noteModalSlice';
import notificationCenterReducer from '@/features/notification/notificationCenterSlice';
import notificationReducer from '@/features/notification/notificationSlice';
import productBrandReducer from '@/features/productBrands/productBrandSlice';
import productOutflowReducer from '@/features/productOutflow/productOutflow';
import deleteProductStockReducer from '@/features/productStock/deleteProductStockSlice';
import productStockSimpleReducer from '@/features/productStock/productStockSimpleSlice';
import productStockReducer from '@/features/productStock/productStockSlice';
import addPurchase from '@/features/purchase/addPurchaseSlice';
import purchases from '@/features/purchase/purchasesSlice';
import purchaseUI from '@/features/purchase/purchaseUISlice';
import settingReducer from '@/features/setting/settingSlice';
import taxReceiptReducer from '@/features/taxReceipt/taxReceiptSlice';
import themeReducer from '@/features/theme/themeSlice';
import updateProductReducer from '@/features/updateProduct/updateProductSlice';
import UserNotificationReducer from '@/features/UserNotification/UserNotificationSlice';
import usersManagementSlice from '@/features/usersManagement/usersManagementSlice';
import rowShelfModalReducer from '@/features/warehouse/rowShelfModalSlice';
import segmentModalReducer from '@/features/warehouse/segmentModalSlice';
import shelfModalReducer from '@/features/warehouse/shelfModalSlice';
import warehouseModalReducer from '@/features/warehouse/warehouseModalSlice';
import warehouseReducer from '@/features/warehouse/warehouseSlice';

import { totalsListener } from './middleware/cartTotalsListener';

const isDev = import.meta.env.MODE !== 'production';

export const store = configureStore({
  reducer: {
    // Core
    app: appReducer,
    nav: navReducer,
    loader: loaderReducer,
    alert: alertReducer,
    navigation: navigationReducer,

    // Auth & Users
    user: userReducer,
    business: businessReducer,
    abilities: abilitiesReducer,
    usersManagement: usersManagementSlice,

    // UI Components
    modal: modalReducer,
    theme: themeReducer,
    setting: settingReducer,
    notification: notificationReducer,
    notificationCenter: notificationCenterReducer,
    userNotification: UserNotificationReducer,
    imageViewer: viewerImageReducer,
    note: noteModalReducer,

    // Products & Categories
    category: categoryReducer,
    updateProduct: updateProductReducer,
    filterProducts: filterProductsSliceReducer,
    customProduct: customProductReducer,
    productOutflow: productOutflowReducer,
    activeIngredients: activeIngredientsReducer,
    productBrand: productBrandReducer,

    // Cart & Orders
    cart: cartReducer,
    clientCart: clientCartReducer,
    addOrder: addOrderReducer,

    // Financial
    cashCountManagement: cashCountManagementReducer,
    cashCountState: cashCountState,
    accountsReceivable: accountsReceivableReducer,
    accountsReceivablePayment: accountsReceivablePaymentReducer,
    insuranceAccountsReceivable: insuranceAccountsReceivableReducer,
    creditNoteModal: creditNoteModalReducer,
    expenseManagement,
    expensesList,
    expenseUI,
    addPurchase,
    purchases,
    purchaseUI,

    // Invoicing
    invoiceForm: invoiceFormReducer,
    invoicePreview: invoicePreviewReducer,
    invoiceWorkspaceModal: invoiceWorkspaceModalReducer,
    taxReceipt: taxReceiptReducer,

    // Warehouse & Inventory
    warehouse: warehouseReducer,
    warehouseModal: warehouseModalReducer,
    shelfModal: shelfModalReducer,
    rowShelfModal: rowShelfModalReducer,
    segmentModal: segmentModalReducer,
    productStock: productStockReducer,
    productStockSimple: productStockSimpleReducer,
    deleteProductStock: deleteProductStockReducer,

    // Utilities
    barcodePrintModal: barcodePrintModalReducer,
    files: fileReducer,
    insurance: insuranceReducer,
    insuranceConfigModal: insuranceConfigModalReducer,
    insuranceAuth: insuranceAuthReducer,
    doctors: doctorsReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      // Disable serializable check in dev to avoid slowdowns with large state
      serializableCheck: false,
      // Disable immutable check for better performance in dev
      immutableCheck: isDev ? { warnAfter: 128 } : false,
    }).prepend(totalsListener.middleware),
  devTools: isDev,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
