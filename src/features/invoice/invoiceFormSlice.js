import { createSlice } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

import {
  getProductsPrice,
  getProductsTax,
  getProductsTotalPrice,
  getTotalItems,
} from '../../utils/pricing';

const roundToTwoDecimals = (num) => {
  return Math.round(num * 100) / 100;
};

const updateProductAmount = (product, newAmount) => {
  // Crear una copia profunda de los objetos anidados
  const updatedProduct = {
    ...product,
    pricing: { ...product?.pricing },
  };

  updatedProduct.amountToBuy = newAmount;

  return updatedProduct;
};

const calculateTotals = (products) => {
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

const calculateTotalItems = (products) => {
  let totalItems = getTotalItems(products);
  // products.forEach(product => {
  //     totalItems += product.amountToBuy;
  // });
  return totalItems;
};

const applyDiscount = (
  totalPurchase,
  discountValue,
  discountType = 'percentage',
) => {
  let discountAmount = 0;

  if (discountType === 'percentage') {
    discountAmount = totalPurchase * (discountValue / 100);
  } else if (discountType === 'fixed') {
    // Para descuento fijo, el descuento no puede exceder el total
    discountAmount = Math.min(discountValue, totalPurchase);
  }

  return roundToTwoDecimals(totalPurchase - discountAmount);
};

const calculateChange = (totalPurchase, payment) => {
  return roundToTwoDecimals(payment - totalPurchase);
};

const calculateTotalPurchaseWithoutTaxes = (products) => {
  const result = getProductsPrice(products);
  return roundToTwoDecimals(result);
};

const invoice = {
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
    type: 'percentage', // 'percentage' o 'fixed'
  },
};

const initialState = {
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
    addInvoice(state, action) {
      const { mode, invoice, authorizationRequest = null } = action.payload;

      // Asegúrate de que todos los productos tengan los cálculos correctos
      const products = invoice.products.map((product) => {
        return updateProductAmount(product, product.amountToBuy);
      });

      // Calcular totales, impuestos y cantidad de artículos
      const { totalPurchase, totalTaxes } = calculateTotals(products);
      const totalItems = calculateTotalItems(invoice.products);
      const totalWithoutTaxes = calculateTotalPurchaseWithoutTaxes(
        invoice.products,
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
      if (invoice.discount && invoice.discount.value) {
        const discountType = invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          state.invoice.totalPurchase.value,
          invoice.discount.value,
          discountType,
        );
      }

      // Calcular el cambio si es necesario
      if (invoice.payment && invoice.payment.value) {
        // Crear una nueva copia del objeto change
        const newChange = { ...state.invoice.change };
        newChange.value = calculateChange(
          state.invoice.totalPurchase.value,
          invoice.payment.value,
        );

        // Actualizar el estado con el nuevo objeto
        state.invoice.change = newChange;
      }

      state.modal.mode = mode || 'add';
      state.modal.isOpen = true;
      state.authorizationRequest = authorizationRequest;
    },
    addProductInvoiceForm(state, action) {
      //esto agrega un producto a la factura
      const { product } = action.payload;
      if (!product) {
        return;
      }
      const productId = product.id;
      if (!productId) {
        return;
      }
      const index = state.invoice.products.findIndex(
        (item) => item.id === productId,
      );
      if (index !== -1) {
        // Si el producto ya está en la lista, actualizar la cantidad
        state.invoice.products[index] = updateProductAmount(
          state.invoice.products[index],
          state.invoice.products[index].amountToBuy.total + 1,
        );
      } else {
        state.invoice.products = [...state.invoice.products, product];
      }

      // Recalcular los totales de compra e impuestos

      const { totalPurchase, totalTaxes } = calculateTotals(
        state.invoice.products,
      );
      state.invoice.totalPurchase.value = totalPurchase;
      state.invoice.totalTaxes.value = totalTaxes;
      // Actualizar la cantidad total de artículos
      state.invoice.totalShoppingItems.value = calculateTotalItems(
        state.invoice.products,
      );

      // Aplicar descuento si existe
      if (state.invoice.discount.value) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          state.invoice.totalPurchase.value,
          state.invoice.discount.value,
          discountType,
        );
      }

      // Calcular el cambio si es necesario
      if (state.invoice.payment.value) {
        state.invoice.change.value = calculateChange(
          state.invoice.totalPurchase.value,
          state.invoice.payment.value,
        );
      }
    },
    cancelInvoice: (state, action) => {
      const { cancelationReason, user } = action.payload;
      state.invoice.cancel = {
        reason: cancelationReason,
        cancelledAt: DateTime.now().toMillis(),
        user: user,
      };
    },
    changeValueInvoiceForm(state, action) {
      const { invoice } = action.payload;
      state.invoice = { ...state.invoice, ...invoice };
      // Recalcular los totales basados en los productos actuales
      const { totalPurchase, totalTaxes } = calculateTotals(
        state.invoice.products,
      );
      state.invoice.totalPurchase.value = totalPurchase;
      state.invoice.totalTaxes.value = totalTaxes;
      state.invoice.totalShoppingItems.value = calculateTotalItems(
        state.invoice.products,
      );

      // Calcular el total de la compra sin impuestos
      state.invoice.totalPurchaseWithoutTaxes.value =
        calculateTotalPurchaseWithoutTaxes(state.invoice.products);

      // Aplicar descuento si existe
      if (state.invoice.discount && state.invoice.discount.value) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          state.invoice.totalPurchase.value,
          state.invoice.discount.value,
          discountType,
        );
      }

      // Calcular el cambio si es necesario
      if (state.invoice.payment && state.invoice.payment.value) {
        state.invoice.change.value = calculateChange(
          state.invoice.totalPurchase.value,
          state.invoice.payment.value,
        );
      }
    },
    changeClientInvoiceForm(state, action) {
      const { client } = action.payload;
      state.invoice.client = { ...state.invoice.client, ...client };
    },
    deleteProductInvoiceForm(state, action) {
      const { product } = action.payload;
      if (!product) {
        return;
      }
      const index = state.invoice.products.findIndex(
        (item) => item.id === product.id,
      );
      if (index === -1) {
        return;
      }
      state.invoice.products.splice(index, 1);

      const { totalPurchase, totalTaxes } = calculateTotals(
        state.invoice.products,
      );
      state.invoice.totalPurchase.value = totalPurchase;
      state.invoice.totalTaxes.value = totalTaxes;

      state.invoice.totalShoppingItems.value = calculateTotalItems(
        state.invoice.products,
      );

      state.invoice.totalPurchaseWithoutTaxes.value =
        calculateTotalPurchaseWithoutTaxes(state.invoice.products);

      if (state.invoice.discount.value) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          state.invoice.totalPurchase.value,
          state.invoice.discount.value,
          discountType,
        );
      }

      state.invoice.change.value = calculateChange(
        state.invoice.totalPurchase.value,
        state.invoice.payment.value,
      );
    },
    changeAmountToBuyProduct(state, action) {
      const { product, type, amount } = action.payload;
      if (!product) {
        return;
      }
      const index = state.invoice.products.findIndex(
        (item) => item.id === product.id,
      );
      if (index === -1) {
        return; // Si el producto no está en la lista, no hacer nada
      }

      let newAmount = state.invoice.products[index].amountToBuy;
      switch (type) {
        case 'add':
          newAmount += 1;
          break;
        case 'subtract':
          newAmount = Math.max(1, newAmount - 1); // Evitar valores negativos
          break;
        case 'change':
          newAmount = Math.max(1, amount); // Establecer la cantidad directamente, evitando negativos
          break;
        default:
          break;
      }

      // Actualizar la cantidad y el precio del producto
      state.invoice.products[index] = updateProductAmount(
        state.invoice.products[index],
        newAmount,
      );

      // Recalcular el total de la compra y los impuestos
      const { totalPurchase, totalTaxes } = calculateTotals(
        state.invoice.products,
      );
      state.invoice.totalPurchase.value = totalPurchase;
      state.invoice.totalTaxes.value = totalTaxes;
      // Actualizar cantidad total de artículos
      state.invoice.totalShoppingItems.value = calculateTotalItems(
        state.invoice.products,
      );

      // Aplicar descuento si existe
      if (state.invoice.discount.value) {
        const discountType = state.invoice.discount.type || 'percentage';
        state.invoice.totalPurchase.value = applyDiscount(
          state.invoice.totalPurchase.value,
          state.invoice.discount.value,
          discountType,
        );
      }

      // Calcular el cambio
      state.invoice.change.value = calculateChange(
        state.invoice.totalPurchase.value,
        state.invoice.payment.value,
      );
    },
    closeInvoiceForm(state, action) {
      const clear = action?.payload?.clear || true;
      state.modal.isOpen = false;
      state.authorizationRequest = null;

      if (clear) {
        state.invoice = invoice;
        state.modal.mode = 'add';
      }
    },
    clearInvoice(state) {
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
export const selectInvoice = (state) => state.invoiceForm;

// Exportar el reducer
export default invoiceFormSlice.reducer;
