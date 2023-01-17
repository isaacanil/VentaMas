import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';

const initialState = {
    orderFilterOptions: [
        {
            name: 'Proveedor',
            Items: [
                {
                    id: nanoid(8),
                    name: 'Proveedor 1',
                    selected: false
                },
                {
                    id: nanoid(8),
                    name: 'Proveedor 2',
                    selected: false
                },
                {
                    id: nanoid(8),
                    name: 'Proveedor 3',
                    selected: false
                },
                {
                    id: nanoid(8),
                    name: 'Proveedor 4',
                    selected: false
                }
            ]

        },
        {
            name: 'Estado',
            Items: [
                {
                    name: 'Estado 1',
                    selected: false
                },
                {
                    name: 'Estado 2',
                    selected: false
                },
                {
                    name: 'Estado 3',
                    selected: false
                },
                {
                    name: 'Estado 4',
                    selected: false
                }
            ]
        },
    ]
}

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        handleSelectOptions: (state, actions) => {
           
        }
    }
})

//export const {  } = orderSlice.actions;

//selectors
export const selectOrderFilterOptions = (state) => state.order.orderFilterOptions;

export default orderSlice.reducer