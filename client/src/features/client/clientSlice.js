import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    mode: '',
    client: {
        name: '',
        tel: '',
        address: '',
        personalID: '',
        delivery: '',
        id: '',
    }
}

export const clientSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        
    }
})

export const { login, logout } = userSlice.actions;

//selectors
export const selectUser = (state) => state.user.user;

export default userSlice.reducer