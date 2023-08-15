import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';
import { orderAndDataCondition, orderAndDataState } from '../../constants/orderAndPurchaseState';


const initialState = {
    orderFilterOptions: [
        {
            name: 'Estados',
            id: nanoid(8),
            isOpen: false,
            Items: orderAndDataState
        },
        {
            name: 'Condición',
            id: nanoid(8),
            isOpen: false,
            Items: orderAndDataCondition
        },
    ],
    pendingOrders: [

    ]
}

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        handleSetOptions: (state, actions) => {
            // Función para manejar opciones y actualizar estado
            const { optionsID, datas, propertyName } = actions.payload
            let newOptionGroup = {
                name: optionsID,
                id: nanoid(8),
                isOpen: false,
                Items: datas.map((item) => { return { ...item[propertyName], selected: false } })
            }
            // Buscando objeto existente
            let exist = state.orderFilterOptions.find(x => x.name === optionsID);
            // Si existe, lo actualiza
            if (exist) {
                // Recorriendo arreglo y reemplazando objeto existente
                let newFilterOptions = state.orderFilterOptions.map(x => x.name === optionsID ? newOptionGroup : x);
                // Retornando nuevo estado
                return { ...state, orderFilterOptions: newFilterOptions };
            }
            // Si no existe, lo agrega
            else {
                // Creando copia de estado y agregando nuevo objeto
                const newState = { ...state, orderFilterOptions: [...state.orderFilterOptions, newOptionGroup] };
                // Retornando nuevo estado
                return newState;
            }
        },
        handleOpenOptions: (state, actions) => {
            const { id } = actions.payload
            //const newFilterOptions = state.orderFilterOptions.find((item)=>item.id === id)
            let newFilterOptions = state.orderFilterOptions.map((item) => {
                if (item.id === id) {
                    return { ...item, isOpen: !item.isOpen };
                } else if (item.id !== id) {
                    return { ...item, isOpen: false };
                }
            });
            state.orderFilterOptions = newFilterOptions

        },
        selectPendingOrder: (state, actions) => {
            const { id } = actions.payload
            const newState = { ...state }
            const newPendingOrders = newState.pendingOrders[0].Items.map((item) => {
                if (item.id === id) {
                    return { ...item, selected: true }
                } else if (item.id !== id) {
                    return { ...item, selected: false }
                }
            });
            newState.pendingOrders[0].Items = newPendingOrders
        },
        getPendingOrdersFromDB: (state, actions) => {
            // Función para manejar opciones y actualizar estado
            const { optionsID, datas } = actions.payload
            let newOptionGroup = {
                name: optionsID,
                id: nanoid(8),
                isOpen: false,
                Items: datas.map((item) => { return { ...item.data, selected: false } })
            }
            // Buscando objeto existente
            let exist = state.pendingOrders.find(x => x.name === optionsID);
            // Si existe, lo actualiza
            if (exist) {
                // Recorriendo arreglo y reemplazando objeto existente
                let newFilterOptions = state.pendingOrders.map(x => x.name === optionsID ? newOptionGroup : x);
                // Retornando nuevo estado
                return { ...state, pendingOrders: newFilterOptions };
            }
            // Si no existe, lo agrega
            else {
                // Creando copia de estado y agregando nuevo objeto
                const newState = { ...state, pendingOrders: [...state.pendingOrders, newOptionGroup] };
                // Retornando nuevo estado
                return newState;
            }
        },
        getDefaultOrderState: (state) => {
            state.orderFilterOptions
        }

    }
})

export const { getPendingOrdersFromDB, handleOpenOptions, handleSetOptions, selectPendingOrder } = orderSlice.actions;

//selectors
export const selectOrderFilterOptions = (state) => state.order.orderFilterOptions;

export const selectOrderList = (state) => state.order.pendingOrders;
export const selectOrderItemSelected = (state) => state.order.pendingOrders;

export default orderSlice.reducer;