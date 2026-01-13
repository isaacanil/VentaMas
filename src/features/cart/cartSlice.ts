import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

import { GenericClient } from '@/features/clientCart/clientCartSlice';
import { roundDecimals } from '@/utils/pricing';

import { initialState, defaultDelivery } from './default/default';
import { updateAllTotals } from './utils/updateAllTotals';

export const cartSlice = createSlice({
  name: 'factura',
  initialState,
  reducers: {
    toggleCart: (state: any) => {
      const isOpen = state.isOpen;
      state.isOpen = !isOpen;
    },
    loadCart: (state: any, actions: PayloadAction<any>) => {
      const cart = actions.payload;
      if (cart?.id) {
        // Convert Firestore Timestamps to milliseconds for serialization
        const processedCart = { ...cart };

        // Convert preorderDetails.date if it exists
        if (processedCart.preorderDetails?.date) {
          const date = processedCart.preorderDetails.date;
          // Check if it's a Firestore Timestamp (has seconds and nanoseconds)
          if (date.seconds !== undefined && date.nanoseconds !== undefined) {
            processedCart.preorderDetails = {
              ...processedCart.preorderDetails,
              date: date.seconds * 1000, // Convert to milliseconds
            };
          }
        }

        // Convert history array dates if they exist
        if (processedCart.history && Array.isArray(processedCart.history)) {
          processedCart.history = processedCart.history.map((historyItem: any) => {
            if (historyItem?.date) {
              const date = historyItem.date;
              // Check if it's a Firestore Timestamp
              if (
                date.seconds !== undefined &&
                date.nanoseconds !== undefined
              ) {
                return {
                  ...historyItem,
                  date: date.seconds * 1000, // Convert to milliseconds
                };
              }
            }
            return historyItem;
          });
        }

        state.data = processedCart;
      }
    },
    setClient: (state: any, actions: PayloadAction<any>) => {
      const client = actions.payload;
      if (client?.id) {
        state.data.client = client;
      }
      if (client?.delivery?.status === true) {
        state.data.delivery = client?.delivery;
      } else {
        state.data.delivery = defaultDelivery;
      }
    },
    setDefaultClient: (state: any) => {
      state.data.client = GenericClient;
      state.data.delivery = defaultDelivery;
      state.data.isAddedToReceivables = false;
    },
    setPaymentAmount: (state: any, actions: PayloadAction<any>) => {
      const paymentValue = actions.payload;
      const isPreOrderEnabled = state.settings.isPreOrderEnabled;

      if (
        isPreOrderEnabled &&
        state.data.status === 'preorder' &&
        !state.data.isPreOrder
      ) {
        throw new Error(
          'Debe marcar la factura como preorden antes de proceder al pago.',
        );
      }

      const paymentMethod = state.data.paymentMethod.find(
        (item) => item.status === true,
      );
      if (paymentMethod) {
        state.data.payment.value = Number(paymentValue);
        paymentMethod.value = Number(paymentValue);
      }
    },
    changePaymentValue: (state: any, actions: PayloadAction<any>) => {
      const paymentValue = actions.payload;
      state.data.payment.value = Number(paymentValue);
    },
    updateProductFields: (state: any, action: PayloadAction<any>) => {
      const { id, data } = action.payload;
      const product = state.data.products.find(
        (p) => p.id === id || p.cid === id,
      );
      if (product) {
        Object.assign(product, data);
      }
    },
    addTaxReceiptInState: (state: any, actions: PayloadAction<any>) => {
      state.data.NCF = actions.payload;
    },
    setTaxReceiptEnabled: (state: any, actions: PayloadAction<any>) => {
      const taxReceiptEnabled = actions.payload;
      state.settings.taxReceipt.enabled = taxReceiptEnabled;
    },
    toggleInvoicePanelOpen: (state: any) => {
      state.settings.isInvoicePanelOpen = !state.settings.isInvoicePanelOpen;
    },
    setCartId: (state: any) => {
      if (!state.data.id) {
        const fallbackId = state.data.cartId || state.data.cartIdRef || null;
        state.data.id = fallbackId || nanoid();
      }
    },
    addPaymentMethod: (state: any, actions: PayloadAction<any>) => {
      const data = actions.payload;
      state.data.paymentMethod = data;
    },
    setPaymentMethod: (state: any, actions: PayloadAction<any>) => {
      try {
        const paymentMethod = actions.payload;
        // Asegurarse de que paymentMethod tenga un value numÃ©rico y no negativo
        if (paymentMethod.value !== undefined) {
          paymentMethod.value = Math.max(0, Number(paymentMethod.value) || 0);
        }

        const index = state.data.paymentMethod.findIndex(
          (method: any) => method.method === paymentMethod.method,
        );

        if (index !== -1) {
          state.data.paymentMethod[index] = paymentMethod;
        }

        // Los totales se calcularÃ¡n a travÃ©s del middleware cartTotalsListener
        // que llama a recalcTotals() despuÃ©s de cada cambio en setPaymentMethod
      } catch (error) {
        console.error('Error in setPaymentMethod:', error);
      }
    },
    toggleReceivableStatus: (state: any, actions: PayloadAction<any>) => {
      const value = actions.payload;
      if (value === undefined) {
        state.data.isAddedToReceivables = !state.data.isAddedToReceivables;
      } else {
        state.data.isAddedToReceivables = value;
      }
    },

    changeProductPrice: (state: any, action: PayloadAction<any>) => {
      const { id, pricing, saleUnit, price } = action.payload;
      const product = state.data.products.find((product: any) => product.id === id);
      if (product) {
        if (saleUnit) {
          product.selectedSaleUnit = saleUnit;
        } else if (pricing) {
          product.pricing = pricing;
          product.pricing.price = product.pricing.listPrice;
          product.selectedSaleUnit = null;
        }
        if (price && product.selectedSaleUnit) {
          product.selectedSaleUnit.pricing.price = price;
        } else if (price) {
          product.pricing.price = price;
        }
      }
    },
    changePaymentMethod: (state: any) => {
      const paymentMethod = state.data.paymentMethod;
      const paymentMethodSelected = paymentMethod.findIndex(
        (method: any) => method.status === true,
      );
      if (paymentMethodSelected) {
        paymentMethodSelected;
      }
    },
    addPaymentMethodAutoValue: (state: any) => {
      const totalPurchase = state.data.totalPurchase.value;
      state.data.payment.value = totalPurchase;
    },
    addProduct: (state: any, action: PayloadAction<any>) => {
      const product = action.payload;
      const checkingID = state.data.products.find((p: any) => p.id === product.id);
      const products = state.data.products;

      if (checkingID) {
        if (checkingID?.weightDetail?.isSoldByWeight) {
          const productData = {
            ...product,
            cid: nanoid(8),
          };
          state.data.products = [...products, productData];
        } else {
          // Object.assign(checkingID, product);
          checkingID.productStockId = product.productStockId;
          checkingID.batchId = product.batchId;
          checkingID.stock = product.stock;
          if (product.batchInfo) {
            checkingID.batchInfo = product.batchInfo;
          }
          checkingID.amountToBuy += 1;
        }
      } else {
        const productData = {
          ...product,
          cid: checkingID?.weightDetail?.isSoldByWeight
            ? nanoid(8)
            : product.id,
          insurance: product.insurance || { mode: null, value: 0 },
        };
        state.data.products = [...products, productData];
      }
    },
    deleteProduct: (state: any, action: PayloadAction<any>) => {
      const productFound = state.data.products.find(
        (product: any) => product.cid === action.payload,
      );
      if (productFound) {
        state.data.products.splice(
          state.data.products.indexOf(productFound),
          1,
        );
      }
      if (state.data.products.length === 0) {
        state.data.id = null;
        state.data.products = [];
      }
    },
    onChangeValueAmountToProduct: (state: any, action: PayloadAction<any>) => {
      const { id, value } = action.payload;
      const productFound = state.data.products.find(
        (product: any) => product.id === id,
      );
      if (productFound) {
        productFound.amountToBuy = Number(value);
      }
    },
    addAmountToProduct: (state: any, action: PayloadAction<any>) => {
      const { id } = action.payload;
      const productFound = state.data.products.find(
        (product: any) => product.id === id,
      );
      if (productFound) {
        productFound.amountToBuy = productFound.amountToBuy + 1;
      }
    },
    diminishAmountToProduct: (state: any, action: PayloadAction<any>) => {
      const { id } = action.payload;
      const productFound = state.data.products.find(
        (product) => product.id === id,
      );
      if (productFound) {
        productFound.amountToBuy -= 1;
        if (productFound.amountToBuy === 0) {
          state.data.products.splice(
            state.data.products.indexOf(productFound),
            1,
          );
        }
      }
    },
    setCashPaymentToTotal: (state: any) => {
      const total = state.data.totalPurchase.value;
      // Ajustar array de mÃ©todos de pago
      state.data.paymentMethod = state.data.paymentMethod.map((m) => ({
        ...m,
        value: m.method === 'cash' ? total : 0,
        status: m.method === 'cash',
      }));
      // TambiÃ©n actualizar payment.value y change
      state.data.payment.value = total;
      state.data.change.value = 0;
    },
    resetCart: (state: any) => ({
      ...initialState,
      settings: {
        ...initialState.settings,
        ...state.settings,
        billing: { ...state.settings.billing },
      },
    }),
    changeProductWeight: (state: any, action: PayloadAction<any>) => {
      const { id, weight } = action.payload;
      const product = state.data.products.find((product) => product.cid === id);
      if (product) {
        product.weightDetail.weight = weight;
      }
    },
    totalPurchaseWithoutTaxes: (state: any) => {
      const ProductsSelected = state.data.products;
      const result = ProductsSelected.reduce(
        (total, product) => total + product.cost.total,
        0,
      );
      state.data.totalPurchaseWithoutTaxes.value = roundDecimals(result);
    },
    addDiscount: (state: any, action: PayloadAction<any>) => {
      const value = action.payload;
      state.data.discount.value = Number(value);
    },
    setDiscountAuthorizationContext: (state: any, action: PayloadAction<any>) => {
      if (!state.data.authorizationContext) {
        state.data.authorizationContext = {};
      }
      state.data.authorizationContext.discount = action.payload || null;
    },
    clearDiscountAuthorizationContext: (state: any) => {
      if (state.data.authorizationContext) {
        state.data.authorizationContext.discount = null;
      }
    },
    addSourceOfPurchase: (state: any, actions: PayloadAction<any>) => {
      const source = actions.payload;
      state.data.sourceOfPurchase = source;
    },
    togglePrintInvoice: (state: any) => {
      state.settings.printInvoice = !state.settings.printInvoice;
    },
    toggleInvoicePanel: (state: any) => {
      state.settings.isInvoicePanelOpen = !state.settings.isInvoicePanelOpen;
    },
    setBillingSettings: (state: any, action: PayloadAction<any>) => {
      const { billingMode, isError, isLoading } = action.payload;
      state.settings.billing.billingMode = billingMode;
      state.settings.billing = {
        ...state.settings.billing,
        ...action.payload,
      };
      state.settings.billing.isLoading = isLoading;
      state.settings.billing.isError = isError;
    },
    updateProductInsurance: (state: any, action: PayloadAction<any>) => {
      const { id, mode, value } = action.payload;
      const product = state.data.products.find(
        (p) => p.id === id || p.cid === id,
      );
      if (product) {
        product.insurance = { mode, value };
      }
    },
    updateInsuranceStatus: (state: any, action: PayloadAction<any>) => {
      state.data.insuranceEnabled = action.payload;

      if (!action.payload) {
        state.data.products.forEach((product) => {
          if (product.insurance) {
            product.insurance = { mode: null, value: 0 };
          }
        });
      }
    },
    applyPricingPreset: (state: any, action: PayloadAction<any>) => {
      const { priceKey } = action.payload || {};
      if (!priceKey) return;

      const applyPrice = (pricing) => {
        if (!pricing) return false;
        const candidate = Number(pricing?.[priceKey]);
        if (Number.isFinite(candidate) && candidate > 0) {
          pricing.price = candidate;
          return true;
        }
        return false;
      };

      state.data.products.forEach((product) => {
        if (!product) return;
        const { pricing = {}, selectedSaleUnit } = product;
        applyPrice(pricing);
        if (selectedSaleUnit?.pricing) {
          applyPrice(selectedSaleUnit.pricing);
        }
      });

      updateAllTotals(state);
    },
    recalcTotals: (state: any, action: PayloadAction<any>) => {
      const paymentValue =
        action.payload !== undefined && action.payload !== null
          ? Number(action.payload)
          : undefined;
      updateAllTotals(state, paymentValue);

      // Auto-remove from CxC if payment covers total purchase
      if (state.data.isAddedToReceivables) {
        const totalPurchase = state.data.totalPurchase?.value || 0;
        const totalPayment = state.data.payment?.value || 0;

        // If payment is greater than or equal to total purchase, remove from CxC
        if (totalPayment >= totalPurchase && totalPurchase > 0) {
          state.data.isAddedToReceivables = false;
          // Set a flag to show notification after this reducer completes
          state.showCxcAutoRemovalNotification = true;
        }
      }
    },
    addInvoiceComment: (state: any, action: PayloadAction<any>) => {
      state.data.invoiceComment = action.payload;
    },
    deleteInvoiceComment: (state: any) => {
      state.data.invoiceComment = '';
    },
    clearCxcAutoRemovalNotification: (state: any) => {
      state.showCxcAutoRemovalNotification = false;
    },
    updateProductDiscount: (state: any, action: PayloadAction<any>) => {
      const { id, discount } = action.payload;
      const product = state.data.products.find(
        (p) => p.id === id || p.cid === id,
      );
      if (product) {
        product.discount = discount;
        updateAllTotals(state);
      }
    },
    setCreditNotePayment: (state: any, action: PayloadAction<any>) => {
      const creditNoteSelections = action.payload || [];

      // Calcular el total de notas de crÃ©dito aplicadas
      const totalCreditNoteAmount = creditNoteSelections.reduce(
        (sum, selection) => sum + (selection.amountToUse || 0),
        0,
      );

      // Calcular cuÃ¡nto se ha pagado con otros mÃ©todos
      const totalOtherPayments = state.data.paymentMethod
        .filter((method) => method.status && method.method !== 'creditNote')
        .reduce((sum, method) => sum + (Number(method.value) || 0), 0);

      // Validar que el total no exceda el monto de la compra
      const totalPurchase = state.data.totalPurchase?.value || 0;
      const remainingToPay = Math.max(0, totalPurchase - totalOtherPayments);
      const validCreditNoteAmount = Math.min(
        totalCreditNoteAmount,
        remainingToPay,
      );

      // Si el monto de notas de crÃ©dito es vÃ¡lido, aplicarlo
      if (validCreditNoteAmount >= 0) {
        state.data.creditNotePayment = creditNoteSelections
          .filter((selection) => selection.amountToUse > 0)
          .map((selection) => ({
            id: selection.id,
            ncf:
              selection.creditNote?.ncf || selection.creditNote?.number || '',
            amountUsed: selection.amountToUse,
            originalAmount: selection.creditNote?.totalAmount || 0,
            appliedDate: new Date().toISOString(),
          }));
      }

      // Actualizar el mÃ©todo de pago de notas de crÃ©dito
      const creditNoteMethodIndex = state.data.paymentMethod.findIndex(
        (method) => method.method === 'creditNote',
      );

      if (creditNoteMethodIndex !== -1) {
        state.data.paymentMethod[creditNoteMethodIndex] = {
          ...state.data.paymentMethod[creditNoteMethodIndex],
          value: validCreditNoteAmount,
          status: validCreditNoteAmount > 0,
        };
      } else if (validCreditNoteAmount > 0) {
        // Si no existe el mÃ©todo de pago de notas de crÃ©dito, agregarlo
        state.data.paymentMethod.push({
          method: 'creditNote',
          name: 'Notas de CrÃ©dito',
          value: validCreditNoteAmount,
          status: true,
        });
      }
    },
    clearCreditNotePayment: (state: any) => {
      state.data.creditNotePayment = [];

      // Desactivar el mÃ©todo de pago de notas de crÃ©dito
      const creditNoteMethodIndex = state.data.paymentMethod.findIndex(
        (method) => method.method === 'creditNote',
      );

      if (creditNoteMethodIndex !== -1) {
        state.data.paymentMethod[creditNoteMethodIndex] = {
          ...state.data.paymentMethod[creditNoteMethodIndex],
          value: 0,
          status: false,
        };
      }
    },
  },
});

export const {
  addAmountToProduct,
  setCartId,
  setClient,
  setPaymentAmount,
  addPaymentMethod,
  addDiscount,
  setDiscountAuthorizationContext,
  clearDiscountAuthorizationContext,
  addPaymentMethodAutoValue,
  addProduct,
  addSourceOfPurchase,
  addTaxReceiptInState,
  resetCart,
  changeProductPrice,
  changeProductWeight,
  setCashPaymentToTotal,
  deleteProduct,
  setPaymentMethod,
  toggleReceivableStatus,
  diminishAmountToProduct,
  onChangeValueAmountToProduct,
  loadCart,
  toggleInvoicePanelOpen,
  totalPurchaseWithoutTaxes,
  setTaxReceiptEnabled,
  updateProductFields,
  toggleCart,
  togglePrintInvoice,
  toggleInvoicePanel,
  setDefaultClient,
  setBillingSettings,
  updateProductInsurance,
  applyPricingPreset,
  recalcTotals,
  updateInsuranceStatus,
  addInvoiceComment,
  deleteInvoiceComment,
  updateProductDiscount,
  clearCxcAutoRemovalNotification,
  setCreditNotePayment,
  clearCreditNotePayment,
} = cartSlice.actions;

export const SelectProduct = (state) => state.cart.data.products;
export const SelectFacturaData = (state) => state.cart.data;
export const SelectClient = (state) => state.cart.data.client;
export const SelectDelivery = (state) => state.cart.data.delivery;
export const SelectTotalPurchaseWithoutTaxes = (state) =>
  state.cart.data.totalPurchaseWithoutTaxes.value;
export const SelectTotalTaxes = (state) => state.cart.data.totalTaxes.value;
export const SelectTotalPurchase = (state) =>
  state.cart.data.totalPurchase.value;
export const SelectTotalShoppingItems = (state) =>
  state.cart.data.totalShoppingItems.value;
export const SelectChange = (state) => state.cart.data.change.value;
export const SelectSourceOfPurchase = (state) =>
  state.cart.data.sourceOfPurchase;
export const SelectPaymentValue = (state) => state.cart.data.payment.value;
export const SelectDiscount = (state) => state.cart.data.discount.value;
export const SelectNCF = (state) => state.cart.data.NCF;
export const SelectCartPermission = (state) => state.cart.permission;
export const SelectCartIsOpen = (state) => state.cart.isOpen;
export const SelectCartData = (state) => state.cart.data;
export const SelectInvoiceComment = (state) => state.cart.data.invoiceComment;
export const SelectSettingCart = (state) => state.cart.settings;
export const SelectCxcAutoRemovalNotification = (state) =>
  state.cart.showCxcAutoRemovalNotification;
export const selectCart = (state) => state.cart;
export const selectInsuranceEnabled = (state) =>
  state.cart.data.insuranceEnabled;
export const selectProductsWithIndividualDiscounts = createSelector(
  [(state) => state.cart.data.products],
  (products = []) =>
    products.filter(
      (product) => product.discount && product.discount.value > 0,
    ),
);

export const selectTotalIndividualDiscounts = createSelector(
  [
    selectProductsWithIndividualDiscounts,
    (state) => state.taxReceipt?.enabled ?? true,
  ],
  (discountedProducts, taxReceiptEnabled) =>
    discountedProducts.reduce((total, product) => {
      const productPrice = product.pricing?.price || product.price || 0;
      const taxPercentage = Number(product.pricing?.tax) || 0;
      const quantity = product.amountToBuy || 1;

      const unitPriceWithTax = taxReceiptEnabled
        ? productPrice * (1 + taxPercentage / 100)
        : productPrice;
      const totalPriceWithTax = unitPriceWithTax * quantity;

      if (product.discount.type === 'percentage') {
        return total + totalPriceWithTax * (product.discount.value / 100);
      }

      return total + product.discount.value;
    }, 0),
);

export const selectCreditNotePayment = (state) =>
  state.cart.data.creditNotePayment;
export const selectTotalCreditNotePayment = (state) =>
  state.cart.data.creditNotePayment.reduce(
    (sum, selection) => sum + (selection.amountUsed || 0),
    0,
  );

export default cartSlice.reducer;


