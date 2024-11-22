import { createSlice } from '@reduxjs/toolkit'
import { CLIENT_MODE_BAR } from './clientMode'
import { fbAddClient } from '../../firebase/client/fbAddClient'
import { fbUpdateClient } from '../../firebase/client/fbUpdateClient'
import { useCompareObjectsInState } from '../../hooks/useCompareObject'
import { useDispatch } from 'react-redux'

export const GenericClient = {
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
const EmptyClient = {
    name: '',
    tel: '',
    address: '',
    personalID: '',
    delivery: {
        status: false,
        value: 0
    },
    id: '',
}

const initialState = {
    mode: CLIENT_MODE_BAR.SEARCH.id,
    labelClientMode: CLIENT_MODE_BAR.SEARCH.label,
    searchTerm: '',
    client: GenericClient,
    copyClient: null,
    isOpen: false,
}

export const clientSlice = createSlice({
    name: 'clientCart',
    initialState,
    reducers: {
        setClient: (state, action) => {
            state.client = { ...state.client, ...action.payload }
        },
        setClientMode: (state, action) => {
            const { SEARCH, CREATE, UPDATE } = CLIENT_MODE_BAR
            state.mode = action.payload

            switch (true) {
                case state.mode === SEARCH.id:
                    state.labelClientMode = SEARCH.label;
                    state.showClientList = SEARCH.showClientList;
                    state.isOpen = false;
                    break;
                case state.mode === CREATE.id:
                    state.labelClientMode = CREATE.label;
                    state.client = EmptyClient;
                    state.showClientList = CREATE.showClientList;
                    state.isOpen = true;
                    break;
                case state.mode === UPDATE.id:
                    state.labelClientMode = UPDATE.label;
                    state.showClientList = UPDATE.showClientList;
                    state.isOpen = false;
                    break;
                default:
                    state.labelClientMode = SEARCH.label;
                    state.showClientList = SEARCH.showClientList;
            }
        },
        setClientSearchTerm: (state, action) => {
            state.searchTerm = action.payload
        },
        addClient: (state, action) => {
            state.client = { ...action.payload }
            state.mode = CLIENT_MODE_BAR.UPDATE.id
            state.copyClient = { ...action.payload }
        },
        setIsOpen: (state, action) => {
            if (action.payload === undefined) {
                state.isOpen = !state.isOpen
            }
            else {
                state.isOpen = action.payload
            }
        },
        deleteClient: (state) => {
            state.client = EmptyClient
            state.isOpen = false
            state.mode = CLIENT_MODE_BAR.SEARCH.id
            state.labelClientMode = CLIENT_MODE_BAR.SEARCH.label
        },
        handleClient: (state, action) => {
            const { user } = action.payload
            if (!state.client.id) {
                state.client = GenericClient
                return
            }
            if ((state?.copyClient !== null && state?.copyClient?.id === state?.client?.id) && !useCompareObjectsInState(state?.client, state?.copyClient)) {
                fbUpdateClient(user, state.client)
                return
            }
            if (!state?.client?.id && state?.client?.name.length > 0 && state.client.name !== 'Cliente Genérico') {
                fbAddClient(user, state.client)
                return
            }
        }

    }
})

export const { setClient, setClientMode, setIsOpen,setClientSearchTerm, deleteClient, addClient, handleClient } = clientSlice.actions;

//selectors
export const selectClient = (state) => state.clientCart.client;
export const selectClientMode = (state) => state.clientCart.mode;
export const selectLabelClientMode = (state) => state.clientCart.labelClientMode;
export const selectIsOpen = (state) => state.clientCart.isOpen;
export const selectClientSearchTerm = (state) => state.clientCart.searchTerm;


export default clientSlice.reducer