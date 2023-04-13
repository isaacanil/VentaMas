import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    mode: '',
    searchTerm: '',
    client: {
        name: '',
        tel: '',
        address: '',
        personalID: '',
        delivery: {

        },
        id: '',
    }
    
}

export const clientSlice = createSlice({
    name: 'clientCart',
    initialState,
    reducers: {
        
    }
})

export const { login, logout } = clientSlice.actions;

//selectors
export const selectUser = (state) => state.client.user;

export default userSlice.reducer