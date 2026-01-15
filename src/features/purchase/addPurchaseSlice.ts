import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

import {
  getDefaultTransactionCondition,
  getDefaultTransactionStatus,
} from '@/constants/orderAndPurchaseState';

interface BackOrderSelection {
  id: string;
  quantity: number;
}

interface ProductSelected {
  key?: string;
  id: string;
  name: string;
  expirationDate?: string | null;
  quantity: number;
  purchaseQuantity: number;
  selectedBackOrders: BackOrderSelection[];
  unitMeasurement: string;
  baseCost: number;
  taxPercentage?: number;
  freight?: number;
  otherCosts?: number;
  unitCost: number;
  subtotal: number;
  initialCost?: number;
  originalId?: string;
  pricing?: { cost?: number; tax?: number };
  product?: { stock?: number };
}

interface PurchaseState {
  id: string | null;
  numberId: string;
  replenishments: ProductSelected[];
  condition?: string;
  note: string;
  orderId: string;
  invoiceNumber: string;
  proofOfPurchase: string;
  completedAt: string | null;
  deliveryAt: string | null;
  paymentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  status?: string;
  attachmentUrls: any[];
  provider: any;
  receiptUrl?: string;
}

interface AddPurchaseState {
  mode: string;
  productSelected: ProductSelected;
  purchase: PurchaseState;
  pendingOrders?: any[];
  products?: any[];
}

interface AddPurchaseRootState {
  addPurchase: AddPurchaseState;
}

const EmptyPurchase = {
  id: null,
  numberId: '',
  replenishments: [],
  condition: getDefaultTransactionCondition()?.id,
  note: '',
  orderId: '',
  invoiceNumber: '',
  proofOfPurchase: '',
  completedAt: null,
  deliveryAt: DateTime.now().toISO(),
  paymentAt: DateTime.now().toISO(),
  createdAt: null,
  updatedAt: null,
  deletedAt: null,
  status: getDefaultTransactionStatus().id,
  attachmentUrls: [],
  provider: null,
};

const EmptyProduct = {
  id: '',
  name: '',
  expirationDate: null,
  quantity: 0,
  purchaseQuantity: 0, // Cantidad total a comprar
  selectedBackOrders: [], // Solo contendrá {id, quantity}
  unitMeasurement: '',
  baseCost: 0,
  taxPercentage: 0,
  freight: 0,
  otherCosts: 0,
  unitCost: 0,
  subtotal: 0,
};

const initialState: AddPurchaseState = {
  mode: 'create',
  productSelected: EmptyProduct,
  purchase: EmptyPurchase,
};
export const addPurchaseSlice = createSlice({
  name: 'addPurchase',
  initialState,
  reducers: {
    setAddPurchaseMode: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      state.mode = actions.payload;
    },
    getOrderData: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const data = actions.payload;
      state.purchase = data ? data : EmptyPurchase;
    },
    setProductSelected: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const newValue = actions.payload;
      state.productSelected = { ...state.productSelected, ...newValue };
    },
    SelectProduct: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const product = actions.payload;
      let productData = {
        key: nanoid(),
        id: product.id,
        name: product.name,
        expirationDate: product.expirationDate ?? null, // Use null for empty date
        quantity: product.quantity ?? 1,
        purchaseQuantity: product.purchaseQuantity ?? (product.quantity ?? 1), // Use existing purchaseQuantity or default to quantity, then 1
        selectedBackOrders: [], // BackOrders seleccionados
        unitMeasurement: product.unitMeasurement ?? '',
        baseCost: product.pricing?.cost ?? product.baseCost ?? 0, // Use pricing cost, then product baseCost, then 0
        taxPercentage:
          product.pricing?.tax ?? product.taxPercentage ?? 0, // Prefill ITBIS from product pricing when available
        freight: product.freight ?? 0,
        otherCosts: product.otherCosts ?? 0,
        unitCost: 0,
        subtotal: 0,
      };

      // Calcular costos iniciales
      productData.unitCost = calculateUnitCost(productData);
      productData.subtotal = calculateSubTotal(productData);

      state.productSelected = productData;
    },
    AddProductToPurchase: (state: AddPurchaseState) => {
      state.purchase.replenishments.push(state.productSelected);
      state.productSelected = EmptyProduct;
    },
    updateStock: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const { stock } = actions.payload;
      state.productSelected.product.stock = stock;
    },
    setPurchase: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const { ...rest } = actions.payload;

      state.purchase = {
        ...state.purchase,
        ...rest,
      };
    },
    getInitialCost: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const { initialCost } = actions.payload;
      state.productSelected.initialCost = initialCost;
    },
    cleanPurchase: (state: AddPurchaseState) => {
      state.productSelected = EmptyProduct;
      state.purchase = EmptyPurchase;
      state.mode = 'add';
    },
    updateProduct: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const { value } = actions.payload;
      // Buscar producto por key o por id (para datos antiguos sin key)
      const productIndex = state.purchase.replenishments.findIndex((item: ProductSelected) => {
        const matchesKey = value?.key && item.key === value.key;
        const matchesId = value?.id && item.id === value.id;
        const matchesOriginalId =
          value?.originalId && item.id === value.originalId;
        return matchesKey || matchesId || matchesOriginalId;
      });
      if (productIndex === -1) return; // Si no se encuentra, no se actualiza

      const currentProduct = state.purchase.replenishments[productIndex];

      // Mantener los backorders existentes si no se pasan nuevos
      const selectedBackOrders =
        value.selectedBackOrders !== undefined
          ? value.selectedBackOrders
          : currentProduct.selectedBackOrders || [];
      const totalBackordersQuantity = selectedBackOrders.reduce(
        (sum: number, order: BackOrderSelection) => sum + order.quantity,
        0,
      );

      // Actualizar purchaseQuantity usando el valor proporcionado o derivado de la cantidad
      const purchaseQuantity =
        value.purchaseQuantity !== undefined
          ? value.purchaseQuantity
          : value.quantity !== undefined
            ? value.quantity + totalBackordersQuantity
            : currentProduct.purchaseQuantity;

      // Calcular la cantidad real restando los backorders
      const quantity =
        value.quantity !== undefined
          ? value.quantity
          : Math.max(0, purchaseQuantity - totalBackordersQuantity);

      const updatedProduct = {
        ...currentProduct,
        ...value,
        purchaseQuantity,
        quantity,
        selectedBackOrders,
      };

      // Calcular nuevos valores usando las funciones auxiliares
      const unitCost = calculateUnitCost(updatedProduct);
      const subtotal = calculateSubTotal(updatedProduct);

      // Actualizar el producto en el estado utilizando el índice encontrado
      state.purchase.replenishments[productIndex] = {
        ...updatedProduct,
        unitCost,
        subtotal,
      };
    },
    addAttachmentToPurchase: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      state.purchase.attachmentUrls = [
        ...state.purchase.attachmentUrls,
        actions.payload,
      ];
    },

    clearProductSelected: (state: AddPurchaseState) => {
      state.productSelected = EmptyProduct;
    },
    deleteReceiptImageFromPurchase: (state: AddPurchaseState) => {
      state.purchase.receiptUrl = '';
    },
    deleteProductFromPurchase: (state: AddPurchaseState, actions: PayloadAction<any>) => {
      const { id, key } = actions.payload;
      state.purchase.replenishments = state.purchase.replenishments.filter(
        (item: ProductSelected) => {
          const matchesKey = key && item.key === key;
          const matchesId = id && item.id === id;
          return !(matchesKey || matchesId);
        },
      );
    },
    setSelectedBackOrders: (state: AddPurchaseState, action: PayloadAction<any>) => {
      const { selectedBackOrders, purchaseQuantity } = action.payload;
      const totalBackordersQuantity = selectedBackOrders.reduce(
        (sum: number, order: BackOrderSelection) => sum + order.quantity,
        0,
      );

      state.productSelected = {
        ...state.productSelected,
        selectedBackOrders, // Solo contiene {id, quantity}
        purchaseQuantity,
        quantity: Math.max(0, purchaseQuantity - totalBackordersQuantity),
      };
    },
    setPurchaseQuantity: (state: AddPurchaseState, action: PayloadAction<any>) => {
      const quantity = action.payload;
      const totalBackordersQuantity =
        state.productSelected.selectedBackOrders.reduce(
          (sum: number, order: BackOrderSelection) => sum + order.quantity,
          0,
        );

      state.productSelected = {
        ...state.productSelected,
        purchaseQuantity: quantity,
        quantity: Math.max(0, quantity - totalBackordersQuantity),
      };
    },
    clearSelectedBackOrders: (state: AddPurchaseState) => {
      state.productSelected = {
        ...state.productSelected,
        selectedBackOrders: [],
        purchaseQuantity: state.productSelected.quantity,
        quantity: state.productSelected.quantity,
      };
    },
  },
});

// Funciones auxiliares para cálculos
const calculateUnitCost = (product: Partial<ProductSelected>): number => {
  const baseCost = Number(product.baseCost) || 0;
  const rawTaxPercentage = Number(product.taxPercentage) || 0;
  const taxRate =
    rawTaxPercentage > 1 ? rawTaxPercentage / 100 : rawTaxPercentage; // Normalizar a porcentaje
  const tax = baseCost * taxRate;
  const freightTotal = Number(product.freight) || 0;
  const otherCostsTotal = Number(product.otherCosts) || 0;
  const quantity = Number(product.quantity) || Number(product.purchaseQuantity) || 0;
  const divisor = quantity > 0 ? quantity : 1; // Evitar divisiones por cero

  const freightPerUnit = freightTotal / divisor;
  const otherCostsPerUnit = otherCostsTotal / divisor;

  return baseCost + tax + freightPerUnit + otherCostsPerUnit;
};

const calculateSubTotal = (product: Partial<ProductSelected>): number => {
  const quantity = Number(product.quantity) || Number(product.purchaseQuantity) || 0;
  const unitCost = calculateUnitCost(product);
  return quantity * unitCost;
};

export const {
  updateStock,
  setPurchase,
  getOrderData,
  updateProduct,
  cleanPurchase,
  SelectProduct,
  setAddPurchaseMode,
  getInitialCost,
  setProductSelected,
  clearProductSelected,
  AddProductToPurchase,
  addAttachmentToPurchase,
  deleteProductFromPurchase,
  deleteReceiptImageFromPurchase,
  setSelectedBackOrders,
  setPurchaseQuantity,
  clearSelectedBackOrders,
} = addPurchaseSlice.actions;

//selectors
export const SelectProductSelected = (state: AddPurchaseRootState) =>
  state.addPurchase.productSelected;
export const selectAddPurchaseList = (state: AddPurchaseRootState) => state.addPurchase.pendingOrders;
export const selectProducts = (state: AddPurchaseRootState) => state.addPurchase.products;
export const selectPurchase = (state: AddPurchaseRootState) => state.addPurchase.purchase;
export const selectPurchaseState = (state: AddPurchaseRootState) => state.addPurchase;

export default addPurchaseSlice.reducer;



