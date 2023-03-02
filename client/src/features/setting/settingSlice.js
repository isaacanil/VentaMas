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
        isConnected: undefined,
        fullScreen: false
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
            state.userPreference.view.rowMode = JSON.parse(savedDataRowMode)
          
        },
        handleRowMode: (state) => {
            let rowMode = state.userPreference.view.rowMode
            localStorage.setItem('viewProductRowMode', JSON.stringify(!rowMode))
            let getData = localStorage.getItem('viewProductRowMode')
            state.userPreference.view.rowMode = JSON.parse(getData)
        },
        toggleFullScreen: (state) => {
            let fullScreenMode = state.system.fullScreen
          
            state.system.fullScreen = !fullScreenMode
        },
        isConnected: () => {

        }

        
    }
})

export const { handleImageHidden, ReloadImageHiddenSetting, handleRowMode, toggleFullScreen} = settingSlice.actions;

//selectors
export const selectImageHidden = (state) => state.setting.userPreference.view.imageHidden;
export const selectIsRow = (state) => state.setting.userPreference.view.rowMode;
export const selectFullScreen = (state) => state.setting.system.fullScreen;
export default settingSlice.reducer