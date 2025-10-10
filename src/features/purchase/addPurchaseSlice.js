import { createSlice } from '@reduxjs/toolkit'
import { notification } from 'antd'
import { DateTime } from 'luxon'

import { getDefaultTransactionCondition, getDefaultTransactionStatus } from '../../constants/orderAndPurchaseState'

const EmptyPurchase = {
    id: null,
    numberId: "",
    replenishments: [],
    condition: getDefaultTransactionCondition()?.id,
    note: "",
    orderId: "",
    invoiceNumber: "",
    proofOfPurchase: "",
    completedAt: null,
    deliveryAt: DateTime.now().toISO(),
    paymentAt: DateTime.now().toISO(),
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
    status: getDefaultTransactionStatus().id,
    attachmentUrls: [],
    provider: null,
}

const EmptyProduct = {
    id: "",
    name: "",
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
    subtotal: 0
}

const initialState = {
    mode: "create",
    productSelected: EmptyProduct,
    purchase: EmptyPurchase,
}
export const addPurchaseSlice = createSlice({
    name: 'addPurchase',
    initialState,
    reducers: {
        setAddPurchaseMode: (state, actions) => {
            state.mode = actions.payload
        },
        getOrderData: (state, actions) => {
            const data = actions.payload
            state.purchase = data ? data : EmptyPurchase
        },
        setProductSelected: (state, actions) => {
            const newValue = actions.payload
            state.productSelected = { ...state.productSelected, ...newValue }
        },
        SelectProduct: (state, actions) => {
            const product = actions.payload;
            let productData = {
                id: product.id,
                name: product.name,
                expirationDate: "",
                quantity: 0,
                purchaseQuantity: 0, // Cantidad total a comprar
                selectedBackOrders: [], // BackOrders seleccionados
                unitMeasurement: '',
                baseCost: product.pricing?.cost || 0,
                taxPercentage: 0,
                freight: 0,
                otherCosts: 0,
                unitCost: 0,
                subtotal: 0
            }
            const findProduct = state.purchase.replenishments.find((item) => item.id === productData.id);
            if (findProduct) {
                productData = {
                    ...productData,
                    ...findProduct,
                }
                notification.info({
                    message: `Edición del producto: ${product.name}`,
                    description: `Al agregar este producto, la cantidad y el costo por unidad serán actualizados con los valores ingresados.`,
                    duration: 0,
                });
            }
            
            // Calcular costos iniciales
            productData.unitCost = calculateUnitCost(productData);
            productData.subtotal = calculateSubTotal(productData);
            
            state.productSelected = productData;
        },
        AddProductToPurchase: (state) => {
            const findProduct = state.purchase.replenishments.find((item) => item.id === state.productSelected.id);
            const productToAdd = {
                ...state.productSelected,
                // quantity ya contiene la cantidad restante
            };

            if (findProduct) {
                const index = state.purchase.replenishments.indexOf(findProduct);
                state.purchase.replenishments[index] = productToAdd;
            } else {
                state.purchase.replenishments.push(productToAdd);
            }
            state.productSelected = EmptyProduct;
        },
        updateStock: (state, actions) => {
            const { stock } = actions.payload
            state.productSelected.product.stock = stock
        },
        setPurchase: (state, actions) => {
            const { ...rest } = actions.payload;

            state.purchase = {
                ...state.purchase,
                ...rest,
            };
        },
        getInitialCost: (state, actions) => {
            const { initialCost } = actions.payload
            state.productSelected.initialCost = initialCost
        },
        cleanPurchase: (state) => {
            state.productSelected = EmptyProduct
            state.purchase = EmptyPurchase
            state.mode = "add"
        },
        updateProduct: (state, actions) => {
            const { value } = actions.payload;
            // Buscar producto por id en lugar de usar un índice entregado
            const productIndex = state.purchase.replenishments.findIndex(item => item.id === value.id);
            if (productIndex === -1) return; // Si no se encuentra, no se actualiza

            const currentProduct = state.purchase.replenishments[productIndex];

            // Mantener los backorders existentes si no se pasan nuevos
            const selectedBackOrders = value.selectedBackOrders !== undefined 
                ? value.selectedBackOrders 
                : currentProduct.selectedBackOrders || [];
            const totalBackordersQuantity = selectedBackOrders.reduce((sum, order) => sum + order.quantity, 0);

            // Actualizar purchaseQuantity usando el valor proporcionado o derivado de la cantidad
            const purchaseQuantity = value.purchaseQuantity !== undefined 
                ? value.purchaseQuantity 
                : value.quantity !== undefined 
                    ? value.quantity + totalBackordersQuantity 
                    : currentProduct.purchaseQuantity;
            
            // Calcular la cantidad real restando los backorders
            const quantity = value.quantity !== undefined 
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
        addAttachmentToPurchase: (state, actions) => {
            state.purchase.attachmentUrls = [...state.purchase.attachmentUrls, actions.payload];
        },

        clearProductSelected: (state) => {
            state.productSelected = EmptyProduct
        },
        deleteReceiptImageFromPurchase: (state) => {
            state.purchase.receiptUrl = "";
        },
        deleteProductFromPurchase: (state, actions) => {
            const { id } = actions.payload
            state.purchase.replenishments = state.purchase.replenishments.filter(
                (item) => item.id !== id
            );
        },
        setSelectedBackOrders: (state, action) => {
            const { selectedBackOrders, purchaseQuantity } = action.payload;
            const totalBackordersQuantity = selectedBackOrders.reduce((sum, order) => sum + order.quantity, 0);
            
            state.productSelected = {
                ...state.productSelected,
                selectedBackOrders, // Solo contiene {id, quantity}
                purchaseQuantity,
                quantity: Math.max(0, purchaseQuantity - totalBackordersQuantity)
            };
        },
        setPurchaseQuantity: (state, action) => {
            const quantity = action.payload;
            const totalBackordersQuantity = state.productSelected.selectedBackOrders.reduce((sum, order) => sum + order.quantity, 0);
            
            state.productSelected = {
                ...state.productSelected,
                purchaseQuantity: quantity,
                quantity: Math.max(0, quantity - totalBackordersQuantity)
            };
        },
        clearSelectedBackOrders: (state) => {
            state.productSelected = {
                ...state.productSelected,
                selectedBackOrders: [],
                purchaseQuantity: state.productSelected.quantity,
                quantity: state.productSelected.quantity
            };
        }
    }
})

// Funciones auxiliares para cálculos
const calculateUnitCost = (product) => {
    const baseCost = Number(product.baseCost) || 0;
    const tax = (baseCost * (Number(product.taxPercentage) || 0)) / 100;
    const freight = Number(product.freight) || 0;
    const otherCosts = Number(product.otherCosts) || 0;

    return baseCost + tax + freight + otherCosts;
};

const calculateSubTotal = (product) => {
    console.log(product)
    const quantity = Number(product.purchaseQuantity || product.quantity) || 0;
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
    getPendingPurchaseFromDB,
    addAttachmentToPurchase,
    deleteProductFromPurchase,
    deleteReceiptImageFromPurchase,
    handleSetFilterOptions,
    setSelectedBackOrders,
    setPurchaseQuantity,
    clearSelectedBackOrders
} = addPurchaseSlice.actions;

//selectors
export const SelectProductSelected = (state) => state.addPurchase.productSelected;
export const selectAddPurchaseList = (state) => state.addPurchase.pendingOrders;
export const selectProducts = (state) => state.addPurchase.products;
export const selectPurchase = (state) => state.addPurchase.purchase;
export const selectPurchaseState = (state) => state.addPurchase;

export default addPurchaseSlice.reducer