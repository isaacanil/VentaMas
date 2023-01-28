import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'


const initialState = {
    filterOptions: [
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
    pendingPurchase: [

    ]
}

export const purchaseSlice = createSlice({
    name: 'purchase',
    initialState,
    reducers: {
        getPendingPurchaseFromDB: (state, actions) => {
            const originalOrderList = actions.payload
            let orderList = originalOrderList.map((item) => {
                return { ...item, selected: false }
            })
            state.pendingPurchase = orderList
        },
        handleSetFilterOptions: (state, actions) => {
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
    }
})

export const { getPendingPurchaseFromDB, handleSetFilterOptions } = purchaseSlice.actions;

//selectors

export const selectPurchaseList = (state) => state.order.pendingOrders;

export default purchaseSlice.reducer