import { createSlice } from '@reduxjs/toolkit'
import { initTaxes } from '../../views/component/modals/UpdateProduct/InitializeData'
import { warrantyOptions } from '../../views/component/modals/ProductForm/components/sections/WarrantyInfo'
import { nanoid } from 'nanoid';


const createEmptyProduct = () => ({
    name: '',
    image: '',
    category: '',
    pricing: {
        cost: 0,
        price: 0,
        listPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        tax: initTaxes[0],
    },
    promotions: {
        start: null,
        end: null,
        discount: 0,
        isActive: false,
    },
    weightDetail: {
        isSoldByWeight: false,
        weightUnit: 'lb',
        weight: 0,
    },
    warranty: {
        status: false,
        unit: warrantyOptions[1]?.value || '',
        quantity: 1,
    },
    size: '',
    type: '',
    stock: 0,
    packSize: 1, // Cantidad de productos en un paquete
    netContent: '',
    amountToBuy: 1,
    createdBy: 'unknown',
    id: '',
    isVisible: true,
    trackInventory: true,
    qrcode: '',
    barcode: '',
    order: 1,
    hasExpirationDate: false, 
    selectedSaleUnit: null,
    
});

const initialState = {
    status: false,
    product: createEmptyProduct(),
}

export const updateProductSlice = createSlice({
    name: 'updateProduct',
    initialState,
    reducers: {
        ChangeProductData: (state, action) => {
            const { status, product } = action.payload
            if (!state.status) {
                state.status = status
            }
            state.product = {
                ...state.product,
                ...product,
            };
        },
        setProduct: (state, action) => {
            const product = action.payload
            state.product = {
                ...state.product,
                ...product,
            }
        },
        ChangeProductImage: (state, action) => {
            state.product.image = action.payload
        },
        changeProductPrice: (state, action) => {
            state.product.pricing = {
                ...state.product.pricing,
                ...action?.payload?.pricing
            }
            if (action?.payload?.pricing?.listPrice) {
                state.product.pricing.price = action?.payload?.pricing?.listPrice
            }
        },
           // Activa o desactiva la venta por unidades
           toggleSaleUnits: (state, action) => {
            const { isSoldInUnits } = action.payload;
            state.product.isSoldInUnits = isSoldInUnits;

            if (isSoldInUnits && state.product.saleUnits.length === 0) {
                // Inicializar saleUnits con ejemplos si se activa y está vacío
                state.product.saleUnits = [
                    {
                        id: nanoid(),
                        unitName: 'Caja',
                        quantity: 30,
                        pricing: {
                            cost: 0,
                            price: 0,
                            listPrice: 0,
                            listPriceEnable: true,
                            avgPrice: 0,
                            avgPriceEnable: false,
                            minPrice: 0,
                            minPriceEnable: false,
                            tax: initTaxes[0],
                        },
                    },
                    {
                        id: nanoid(),
                        unitName: 'Pastilla',
                        quantity: 1,
                        pricing: {
                            cost: 0,
                            price: 0,
                            listPrice: 0,
                            listPriceEnable: true,
                            avgPrice: 0,
                            avgPriceEnable: false,
                            minPrice: 0,
                            minPriceEnable: false,
                            tax: initTaxes[0],
                        },
                    },
                ];
                // Seleccionar la primera saleUnit por defecto
                state.product.selectedSaleUnitId = state.product.saleUnits[0].id;
            } else if (!isSoldInUnits) {
                // Si se desactiva, limpiar saleUnits y restablecer selectedSaleUnitId
                state.product.saleUnits = [];
                state.product.selectedSaleUnitId = null;
            }
        },
        // Selecciona una unidad de venta específica
        selectSaleUnit: (state, action) => {
            const { saleUnitId } = action.payload;
            const exists = state.product.saleUnits.some(unit => unit.id === saleUnitId);
            if (exists) {
                state.product.selectedSaleUnitId = saleUnitId;
            }
        },
        // Actualiza todas las unidades de venta


        clearUpdateProductData: (state) => {
            state.product = createEmptyProduct()
            state.status = false
        }
    }
})

export const { ChangeProductData, changeProductPrice, clearUpdateProductData, ChangeProductImage, setProduct, updateSaleOptions, updateSaleUnit } = updateProductSlice.actions;

//selectors
export const selectUpdateProductData = (state) => state.updateProduct;
export const selectUpdateProductStatus = (state) => state.updateProduct.status;
export const selectProduct = (state) => state.updateProduct.product;
export const selectSaleUnits = (state) => state.updateProduct.product.saleUnits;
export const selectIsSoldInUnits = (state) => state.updateProduct.product.isSoldInUnits;
export const selectSelectedSaleUnit = (state) => {
    const { selectedSaleUnitId, saleUnits } = state.updateProduct.product;
    return saleUnits.find(unit => unit.id === selectedSaleUnitId) || null;
};
export const selectSaleUnitById = (state, id) => 
    state.updateProduct.product.saleUnits.find(unit => unit.id === id);

export default updateProductSlice.reducer;