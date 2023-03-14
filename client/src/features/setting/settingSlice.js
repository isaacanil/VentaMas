import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    status: false,
    userPreference: {
        view: {
            imageHidden: true,
            rowMode: false,
            categoryGrouped: false,
        }
    },
    system:{
        isConnected: undefined,
        fullScreen: false,

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
            let savedDataCategoryGrouped = localStorage.getItem('viewProductCategoryGrouped')
            state.userPreference.view.categoryGrouped = JSON.parse(savedDataCategoryGrouped)
          
        },
        handleRowMode: (state) => {
            let rowMode = state.userPreference.view.rowMode
            localStorage.setItem('viewProductRowMode', JSON.stringify(!rowMode))
            let getData = localStorage.getItem('viewProductRowMode')
            state.userPreference.view.rowMode = JSON.parse(getData)
        },
        toggleCategoryGrouped: (state) => {
            let categoryGrouped = state.userPreference.view.categoryGrouped
            localStorage.setItem('viewProductCategoryGrouped', JSON.stringify(!categoryGrouped))
            let getData = localStorage.getItem('viewProductCategoryGrouped')
            state.userPreference.view.categoryGrouped = JSON.parse(getData)
        },
        toggleFullScreen: (state) => {
            let fullScreenMode = state.system.fullScreen
          
            state.system.fullScreen = !fullScreenMode
        },
        isConnected: () => {

        }

        
    }
})

export const { handleImageHidden, toggleCategoryGrouped, ReloadImageHiddenSetting, handleRowMode, toggleFullScreen} = settingSlice.actions;

//selectors
export const selectCategoryGrouped = (state) => state.setting.userPreference.view.categoryGrouped;
export const selectImageHidden = (state) => state.setting.userPreference.view.imageHidden;
export const selectIsRow = (state) => state.setting.userPreference.view.rowMode;
export const selectFullScreen = (state) => state.setting.system.fullScreen;
export default settingSlice.reducer