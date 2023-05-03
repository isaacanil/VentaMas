import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    user: false
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = {...state.user, ...action.payload}
        },
        addUserData: (state, action) => {
            if(state.user){
                state.user = {...state.user, ...action.payload }
            }
        },
        logout: (state) => {
            state.user = null
        }
    }
})

export const { login, logout,  addUserData } = userSlice.actions;

//selectors
export const selectUser = (state) => state.user.user;

export default userSlice.reducer