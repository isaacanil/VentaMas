import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';
import { getProviders } from '../../firebase/firebaseconfig';

const initialState = {
    orderFilterOptions: [
        {
            name: 'Estados',
            id: nanoid(8),
            isOpen: false,
            Items: [
                { id: nanoid(8), name: 'Atrasado', color: '#e66767', selected: false },
                { id: nanoid(8), name: 'Solicitado', color: '#ebdc54', selected: false },
                { id: nanoid(8), name: 'Entregado', color: '#7de08b', selected: false },
                { id: nanoid(8), name: 'Cancelado', color: '#797979', selected: false },
            ]
        },
        {
            name: 'Condición',
            id: nanoid(8),
            isOpen: false,
            Items: [
                { id: nanoid(8), name: 'Contado', selected: false },
                { id: nanoid(8), name: '1 semana', selected: false },
                { id: nanoid(8), name: '15 días', selected: false },
                { id: nanoid(8), name: '30 días', selected: false },
                { id: nanoid(8), name: 'Otros', selected: false },
            ]
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
        // getPendingOrdersFromDB: (state, actions) => {
        //     const originalOrderList = actions.payload
        //     let orderList = originalOrderList.map((item) => {
        //         return { ...item, selected: false }
        //     })
        //     state.pendingOrders = orderList


        // },
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
            const { optionsID, datas, propertyName } = actions.payload
            let newOptionGroup = {
                name: optionsID,
                id: nanoid(8),
                isOpen: false,
                Items: datas.map((item) => { return { ...item[propertyName], selected: false } })
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
        }

    }
})

export const { getPendingOrdersFromDB, handleOpenOptions, handleSetOptions, selectPendingOrder } = orderSlice.actions;

//selectors
export const selectOrderFilterOptions = (state) => state.order.orderFilterOptions;

export const selectOrderList = (state) => state.order.pendingOrders;
export const selectOrderItemSelected = (state) => state.order.pendingOrders;

export default orderSlice.reducer