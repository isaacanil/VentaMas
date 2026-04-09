import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

import {
  getProductsPrice,
  getProductsTax,
  getProductsTotalPrice,
  getTotalItems,
} from '@/utils/pricing';
import {
  applyDiscount,
  calculateChange,
} from '@/features/invoice/utils/invoiceTotals';
import type {
  InvoiceProduct,
  InvoiceData,
  InvoiceFormSliceState,
  DiscountType,
  InvoiceProductAmount,
} from '@/types/invoice';

const roundToTwoDecimals = (num: number): number => {
  return Math.round(num * 100) / 100;
};

const updateProductAmount = (
  product: InvoiceProduct,
  newAmount: number,
): InvoiceProduct => {
  // Crear una copia profunda de los objetos anidados
  const updatedProduct = {
    ...product,
    pricing: { ...product?.pricing },
  };

  updatedProduct.amountToBuy = newAmount;

  return updatedProduct;
};

const calculateTotals = (products: any[]) => {
  let totalPurchase = getProductsTotalPrice(products);
  let totalTaxes = getProductsTax(products);

  return {
    totalPurchase: roundToTwoDecimals(totalPurchase),
    totalTaxes: roundToTwoDecimals(totalTaxes),
  };
};

// const deleteProductAndUpdateTotals = (products, productId) => {
//     const updatedProducts = products.filter(product => product.id !== productId);
//     const { totalPurchase, totalTaxes } = calculateTotals(updatedProducts);
//     return { updatedProducts, totalPurchase, totalTaxes };
// };

const calculateTotalItems = (products: any[]): number => {
  let totalItems = getTotalItems(products);
  // products.forEach(product => {
  //     totalItems += product.amountToBuy;
  // });
  return totalItems;
};

const calculateTotalPurchaseWithoutTaxes = (products: any[]): number => {
  const result = getProductsPrice(products);
  return roundToTwoDecimals(result);
};

const invoice: InvoiceData = {
  id: '',
  sourceOfPurchase: '',
  paymentMethod: [
    {
      name: '',
      status: false,
      method: '',
      value: 0,
    },
    {
      method: '',
      status: false,
      name: '',
      value: 0,
    },
    {
      method: '',
      name: '',
      status: false,
      value: 0,
    },
  ],
  client: {},
  NCF: '',
  totalPurchaseWithoutTaxes: {
    value: 0,
  },
  totalTaxes: {
    value: 0,
  },
  delivery: {
    value: '',
    status: false,
  },
  date: 0,
  change: {
    value: 0,
  },
  products: [],
  payment: {
    value: 0,
  },
  totalPurchase: {
    value: 0,
  },
  payWith: {
    value: 0,
  },
  totalShoppingItems: {
    value: 0,
  },
  discount: {
    value: 0,
    type: 'percentage' as DiscountType, // 'percentage' o 'fixed'
  },
};

const initialState: InvoiceFormSliceState = {
  invoice,
  modal: {
    isOpen: false,
    mode: 'add',
  },
  authorizationRequest: null,
};

const invoiceFormSlice = createSlice({
  name: 'invoiceForm',
  initialState,
  reducers: {
    addInvoice(
      state: InvoiceFormSliceState,
      action: PayloadAction<{
        mode?: string;
        invoice: InvoiceData;
        authorizationRequest?: any;
      }>,
    ) {
      const { mode, invoice, authorizationRequest = null } = action.payload;

      // Asegúrate de que todos los productos tengan los cálculos correctos
      const products = (invoice.products || []).map(
        (product: InvoiceProduct) => {
          const amount =
            typeof product.amountToBuy === 'object' &&
            product.amountToBuy !== null
              ? (product.amountToBuy as InvoiceProductAmount).total || 0
              : (product.amountToBuy as number) || 0;
          return updateProductAmount(product, amount);
        },
      );

      // Calcular totales, impuestos y cantidad de artículos
      const { totalPurchase, totalTaxes } = calculateTotals(products);
      const totalItems = calculateTotalItems(invoice.products || []);
      const totalWithoutTaxes = calculateTotalPurchaseWithoutTaxes(
        invoice.products || [],
      );

      // Actualizar el estado de la factura
      state.invoice = {
        ...invoice,
        products,
        totalPurchase: { value: totalPurchase },
        totalTaxes: { value: totalTaxes },
        totalShoppingItems: { value: totalItems },
        totalPurchaseWithoutTaxes: { value: totalWithoutTaxes },
      };

      // Aplicar descuento si existe
      if (
        invoice.discount &&
        invoice.discount.value &&
        state.invoice.totalPurchase
      ) {
        const discountType = invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          Number(state.invoice.totalPurchase.value) || 0,
          Number(invoice.discount.value) || 0,
          discountType,
        );
      }

      // Calcular el cambio si es necesario
      if (
        invoice.payment &&
        invoice.payment.value &&
        state.invoice.totalPurchase
      ) {
        // Crear una nueva copia del objeto change
        const newChange = { ...(state.invoice.change || { value: 0 }) };
        newChange.value = calculateChange(
          Number(state.invoice.totalPurchase.value) || 0,
          Number(invoice.payment.value) || 0,
        );

        // Actualizar el estado con el nuevo objeto
        state.invoice.change = newChange;
      }

      state.modal.mode = mode || 'add';
      state.modal.isOpen = true;
      state.authorizationRequest = authorizationRequest;
    },
    addProductInvoiceForm(
      state: InvoiceFormSliceState,
      action: PayloadAction<{ product: InvoiceProduct }>,
    ) {
      //esto agrega un producto a la factura
      const { product } = action.payload;
      if (!product) {
        return;
      }
      const productId = product.id;
      if (!productId) {
        return;
      }

      const products = state.invoice.products || [];
      const index = products.findIndex((item) => item.id === productId);
      if (index !== -1) {
        // Si el producto ya está en la lista, actualizar la cantidad
        const currentAmountToBuy = products[index].amountToBuy;
        const currentAmount =
          typeof currentAmountToBuy === 'object' && currentAmountToBuy !== null
            ? (currentAmountToBuy as InvoiceProductAmount).total || 0
            : (currentAmountToBuy as number) || 0;

        products[index] = updateProductAmount(
          products[index],
          currentAmount + 1,
        );
      } else {
        state.invoice.products = [...products, product];
      }

      // Recalcular los totales de compra e impuestos
      const updatedProducts = state.invoice.products || [];
      const { totalPurchase, totalTaxes } = calculateTotals(updatedProducts);

      state.invoice.totalPurchase = { value: totalPurchase };
      state.invoice.totalTaxes = { value: totalTaxes };
      // Actualizar la cantidad total de artículos
      state.invoice.totalShoppingItems = {
        value: calculateTotalItems(updatedProducts),
      };

      // Aplicar descuento si existe
      if (state.invoice.discount?.value && state.invoice.totalPurchase) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          Number(state.invoice.totalPurchase.value) || 0,
          Number(state.invoice.discount.value) || 0,
          discountType,
        );
      }

      // Calcular el cambio si es necesario
      if (state.invoice.payment?.value && state.invoice.totalPurchase) {
        state.invoice.change = {
          value: calculateChange(
            Number(state.invoice.totalPurchase.value) || 0,
            Number(state.invoice.payment.value) || 0,
          ),
        };
      }
    },
    cancelInvoice: (
      state: InvoiceFormSliceState,
      action: PayloadAction<{ cancelationReason: string; user: any }>,
    ) => {
      const { cancelationReason, user } = action.payload;
      state.invoice.cancel = {
        reason: cancelationReason,
        cancelledAt: DateTime.now().toMillis(),
        user: user,
      };
    },
    changeValueInvoiceForm(
      state: InvoiceFormSliceState,
      action: PayloadAction<{ invoice: Partial<InvoiceData> }>,
    ) {
      const { invoice } = action.payload;
      state.invoice = { ...state.invoice, ...invoice };

      const products = state.invoice.products || [];
      // Recalcular los totales basados en los productos actuales
      const { totalPurchase, totalTaxes } = calculateTotals(products);
      state.invoice.totalPurchase = { value: totalPurchase };
      state.invoice.totalTaxes = { value: totalTaxes };
      state.invoice.totalShoppingItems = {
        value: calculateTotalItems(products),
      };

      // Calcular el total de la compra sin impuestos
      state.invoice.totalPurchaseWithoutTaxes = {
        value: calculateTotalPurchaseWithoutTaxes(products),
      };

      // Aplicar descuento si existe
      if (state.invoice.discount?.value && state.invoice.totalPurchase) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          Number(state.invoice.totalPurchase.value) || 0,
          Number(state.invoice.discount.value) || 0,
          discountType,
        );
      }

      // Calcular el cambio si es necesario
      if (state.invoice.payment?.value && state.invoice.totalPurchase) {
        state.invoice.change = {
          value: calculateChange(
            Number(state.invoice.totalPurchase.value) || 0,
            Number(state.invoice.payment.value) || 0,
          ),
        };
      }
    },
    changeClientInvoiceForm(
      state: InvoiceFormSliceState,
      action: PayloadAction<{ client: any }>,
    ) {
      const { client } = action.payload;
      state.invoice.client = { ...(state.invoice.client || {}), ...client };
    },
    deleteProductInvoiceForm(
      state: InvoiceFormSliceState,
      action: PayloadAction<{ product: InvoiceProduct }>,
    ) {
      const { product } = action.payload;
      if (!product) {
        return;
      }
      const products = state.invoice.products || [];
      const index = products.findIndex((item) => item.id === product.id);
      if (index === -1) {
        return;
      }
      products.splice(index, 1);
      state.invoice.products = products;

      const { totalPurchase, totalTaxes } = calculateTotals(products);
      state.invoice.totalPurchase = { value: totalPurchase };
      state.invoice.totalTaxes = { value: totalTaxes };

      state.invoice.totalShoppingItems = {
        value: calculateTotalItems(products),
      };

      state.invoice.totalPurchaseWithoutTaxes = {
        value: calculateTotalPurchaseWithoutTaxes(products),
      };

      if (state.invoice.discount?.value && state.invoice.totalPurchase) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          Number(state.invoice.totalPurchase.value) || 0,
          Number(state.invoice.discount.value) || 0,
          discountType,
        );
      }

      if (state.invoice.payment?.value && state.invoice.totalPurchase) {
        state.invoice.change = {
          value: calculateChange(
            Number(state.invoice.totalPurchase.value) || 0,
            Number(state.invoice.payment.value) || 0,
          ),
        };
      }
    },
    changeAmountToBuyProduct(
      state: InvoiceFormSliceState,
      action: PayloadAction<{
        product: InvoiceProduct;
        type: string;
        amount?: number;
      }>,
    ) {
      const { product, type, amount } = action.payload;
      if (!product) {
        return;
      }
      const products = state.invoice.products || [];
      const index = products.findIndex((item) => item.id === product.id);
      if (index === -1) {
        return; // Si el producto no está en la lista, no hacer nada
      }

      let currentAmountToBuy = products[index].amountToBuy;
      let numericAmount =
        typeof currentAmountToBuy === 'object' && currentAmountToBuy !== null
          ? (currentAmountToBuy as InvoiceProductAmount).total || 0
          : (currentAmountToBuy as number) || 0;

      switch (type) {
        case 'add':
          numericAmount += 1;
          break;
        case 'subtract':
          numericAmount = Math.max(1, numericAmount - 1); // Evitar valores negativos
          break;
        case 'change':
          numericAmount = Math.max(1, Number(amount) || 0); // Establecer la cantidad directamente, evitando negativos
          break;
        default:
          break;
      }

      // Actualizar la cantidad y el precio del producto
      products[index] = updateProductAmount(products[index], numericAmount);
      state.invoice.products = products;

      // Recalcular el total de la compra y los impuestos
      const { totalPurchase, totalTaxes } = calculateTotals(products);
      state.invoice.totalPurchase = { value: totalPurchase };
      state.invoice.totalTaxes = { value: totalTaxes };
      // Actualizar cantidad total de artículos
      state.invoice.totalShoppingItems = {
        value: calculateTotalItems(products),
      };

      // Aplicar descuento si existe
      if (state.invoice.discount?.value && state.invoice.totalPurchase) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          Number(state.invoice.totalPurchase.value) || 0,
          Number(state.invoice.discount.value) || 0,
          discountType,
        );
      }

      // Calcular el cambio
      if (state.invoice.payment?.value && state.invoice.totalPurchase) {
        state.invoice.change = {
          value: calculateChange(
            Number(state.invoice.totalPurchase.value) || 0,
            Number(state.invoice.payment.value) || 0,
          ),
        };
      }
    },
    closeInvoiceForm(
      state: InvoiceFormSliceState,
      action: PayloadAction<{ clear?: boolean } | void>,
    ) {
      const clear = (action?.payload as { clear?: boolean })?.clear ?? true;
      state.modal.isOpen = false;
      state.authorizationRequest = null;

      if (clear) {
        state.invoice = invoice;
        state.modal.mode = 'add';
      }
    },
    clearInvoice(state: InvoiceFormSliceState) {
      state.invoice = invoice;
      state.modal.mode = 'add';
      state.modal.isOpen = false;
      state.authorizationRequest = null;
    },
  },
});

// Exportar acciones
export const {
  addInvoice,
  addProductInvoiceForm,
  closeInvoiceForm,
  cancelInvoice,
  deleteProductInvoiceForm,
  changeValueInvoiceForm,
  changeAmountToBuyProduct,
  changeClientInvoiceForm,
  clearInvoice,
} = invoiceFormSlice.actions;

// Exportar selectors
export const selectInvoice = (state: { invoiceForm: InvoiceFormSliceState }) =>
  state.invoiceForm;

// Exportar el reducer
export default invoiceFormSlice.reducer;
