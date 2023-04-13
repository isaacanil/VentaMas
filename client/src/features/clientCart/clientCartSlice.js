import {createSlice} from '@reduxjs/toolkit'

const GenericClient = {
    name: 'Generic Client',
    tel: '',
    address: '',
    personalID: '',
    delivery: {
        status: false,
        value: 0
    },
    id: 'GC-0000',
}

const initialState = {
    mode: '',
    searchTerm: '',
    labelClientMode: '',
    client: GenericClient,  
}

export const clientSlice = createSlice({
    name: 'clientCart',
    initialState,
    reducers: {
        setClientData: (state, action) => {
            state.client = {...state.client, ...action.payload}
        },
    }
})

export const {  } = clientSlice.actions;

//selectors
export const selectClientCart = (state) => state.clientCart.client;

export default clientSlice.reducer