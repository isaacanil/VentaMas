import { createSlice } from '@reduxjs/toolkit'
import { DateTime } from 'luxon'
import { nanoid } from 'nanoid'
import { OPERATION_MODES } from '../../constants/modes'

const EmptyProductsOutflow = []

const EmptyProduct = {
    id: null, // Identificador único del producto
    product: null, // Identificador del producto específico que se vende
    motive: '', //Identificador de la razón detrás de la salida del producto
    currentRemovedQuantity: 0, // Esta propiedad mantendrá la cantidad retirada actualmente
    totalRemovedQuantity: 0, // La cantidad del producto que se vende.
    observations: "", // Cualquier comentario adicional o notas relacionadas con el producto
    status: false // El estado de la salida del producto (si se ha completado o no)
}
const EmptyProductOutflow = {
    id: null, // Identificador único de la salida del producto
    productList: EmptyProductsOutflow, // Lista de productos que se venden
    date: null, // Fecha de la salida del producto
}
const initialState = {
    mode: OPERATION_MODES.CREATE.label,
    productSelected: EmptyProduct,
    data: {
        id: null,
        productList: EmptyProductsOutflow,
        date: null,
    }
}

export const productOutflowSlice = createSlice({
    name: 'productOutflow',
    initialState,
    reducers: {
        selectProduct: (state, actions) => {
            const newData = actions.payload;
            state.productSelected = {
                ...(state.productSelected || {}),
                ...(newData || {}),
                currentRemovedQuantity: newData.currentRemovedQuantity || 0,
                totalRemovedQuantity: newData.totalRemovedQuantity || 0,
                id: state.productSelected?.id || nanoid(10),
              };
            state.data.date = state.data.date || new Date().getTime()
            state.data.id = state.data.id || nanoid(10)    
        },
        addProductToProductOutflow: (state, actions) => {
            console.log('addProductToProductOutflow', actions.payload)
            let data = actions.payload
            data = {
                ...data,
                totalRemovedQuantity: data.currentRemovedQuantity + data.totalRemovedQuantity,
            }
            state.data.productList = [...state.data.productList, data]
            state.productSelected = EmptyProduct
        },
        deleteProductFromProductOutflow: (state, actions) => {
            const {id} = actions.payload
            const checkingId = state.data.productList.filter(item => item.id !== id)
            if(checkingId){
                state.data.productList = checkingId
            }
        },
        setProductOutflowData : (state, actions) => {
            const {data} = actions.payload
          
           return {
                ...state,
                productSelected: data.productSelected,
                data : {
                    ...state.data,
                    ...data.data,
                },
                mode: data.mode,
              }
        },
        deleteData: (state) => {
            state.mode = OPERATION_MODES.CREATE.label
            state.productSelected = EmptyProduct
            state.data = EmptyProductOutflow 
        }

    }
})

export const {
    selectProduct,
    addProductToProductOutflow,
    deleteProductFromProductOutflow,
    deleteData,
    setProductOutflowData
} = productOutflowSlice.actions;

//selectors
export const SelectProductOutflow = (state) => state.productOutflow;
export const SelectProductSelected = (state) => state.productOutflow.productSelected;
export const SelectProductList = (state) => state.productOutflow.data.productList;


export default productOutflowSlice.reducer