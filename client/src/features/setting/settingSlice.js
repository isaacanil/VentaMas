import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    status: false,
    userPreference: {
        view: {
            imageHidden: true,
            rowMode: false
        }
    },
    system:{
        isConnected: undefined
    }
}

export const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers: {
        handleImageHidden: (state) => {
            let imageDisabled = state.userPreference.view.imageHidden
            localStorage.setItem('viewProductImageDisabled', JSON.stringify(!imageDisabled))
            let savedData = localStorage.getItem('viewProductImageDisabled')
         
            state.userPreference.view.imageHidden = JSON.parse(savedData)  
        },
        ReloadImageHiddenSetting: (state) => {
            let savedDataImageHidden = localStorage.getItem('viewProductImageDisabled')  
            state.userPreference.view.imageHidden = JSON.parse(savedDataImageHidden)
            let savedDataRowMode = localStorage.getItem('viewProductRowMode')
            state.userPreference.view.rowMode = JSON.parse(savedDataRowMode !== null ? savedDataRowMode : false)
            
        },
        handleRowMode: (state) => {
            let rowMode = state.userPreference.view.rowMode
            localStorage.setItem('viewProductRowMode', JSON.stringify(!rowMode))
            let savedData = localStorage.getItem('viewProductRowMode')
            state.userPreference.view.rowMode = JSON.parse(savedData)
        },
        isConnected: () => {

        }

        
    }
})

export const { handleImageHidden, ReloadImageHiddenSetting, handleRowMode} = settingSlice.actions;

//selectors
export const selectImageHidden = (state) => state.setting.userPreference.view.imageHidden;
export const selectIsRow = (state) => state.setting.userPreference.view.rowMode;
export default settingSlice.reducer