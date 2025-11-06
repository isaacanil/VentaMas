import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';

import { warrantyOptions } from '../../views/component/modals/ProductForm/components/sections/WarrantyInfo'
import { initTaxes } from '../../views/component/modals/UpdateProduct/InitializeData'

const DEFAULT_BRAND = 'Sin marca';
export const PRODUCT_BRAND_DEFAULT = DEFAULT_BRAND;

export const PRODUCT_ITEM_TYPE_OPTIONS = [
    { value: 'product', label: 'Producto' },
    { value: 'service', label: 'Servicio' },
    { value: 'combo', label: 'Combo' },
];
const DEFAULT_ITEM_TYPE = PRODUCT_ITEM_TYPE_OPTIONS[0].value;

const normalizeBrand = (value) => {
    if (typeof value !== 'string') {
        return DEFAULT_BRAND;
    }
    const trimmed = value.replace(/\s+/g, ' ').trim();
    return trimmed || DEFAULT_BRAND;
};

const createEmptyProduct = () => ({
    name: '',
    brand: DEFAULT_BRAND,
    image: '',
    category: '',
    itemType: DEFAULT_ITEM_TYPE,
    pricing: {
        cost: 0,
        price: 0,
        listPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        cardPrice: 0,
        offerPrice: 0,
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
    totalUnits: null,
    packSize: 1, // Cantidad de productos en un paquete
    netContent: '',
    restrictSaleWithoutStock: false,
    activeIngredients: '',
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
            if (status && !state.status) {
                state.status = status
            }
            const merged = {
                ...state.product,
                ...product,
            };
            if (product && Object.prototype.hasOwnProperty.call(product, 'brand')) {
                merged.brand = normalizeBrand(product?.brand);
            } else {
                merged.brand = normalizeBrand(merged.brand);
            }
            state.product = merged;
        },
        setProduct: (state, action) => {
            const product = action.payload
            const merged = {
                ...state.product,
                ...product,
            };
            merged.brand = normalizeBrand(merged.brand);
            state.product = merged;
        },
        ChangeProductImage: (state, action) => {
            state.product.image = action.payload
        },        changeProductPrice: (state, action) => {

            state.product.pricing = {
                ...state.product.pricing,
                ...action?.payload?.pricing
            }
            const hasPricing = action?.payload?.pricing && typeof action.payload.pricing === 'object';
            // Si se actualiza el listPrice (aunque sea 0), también actualizar el price principal
            if (hasPricing && Object.prototype.hasOwnProperty.call(action.payload.pricing, 'listPrice')) {
                state.product.pricing.price = action.payload.pricing.listPrice;
            }
            // Si se actualiza el price directamente, mantenerlo (tiene prioridad explícita)
            if (hasPricing && Object.prototype.hasOwnProperty.call(action.payload.pricing, 'price')) {
                state.product.pricing.price = action.payload.pricing.price;
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
                            cardPrice: 0,
                            offerPrice: 0,
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
                            cardPrice: 0,
                            offerPrice: 0,
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
