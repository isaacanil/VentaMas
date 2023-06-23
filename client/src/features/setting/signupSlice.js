import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    userInformation: {
        
    }
}

export const signupSlice = createSlice({
    name: 'dev',
    initialState,
    reducers: {
        
    }
})

export const { handleImageHidden, toggleCategoryGrouped, ReloadImageHiddenSetting, handleRowMode, toggleFullScreen} = settingSlice.actions;

//selectors
export const selectCategoryGrouped = (state) => state.setting.userPreference.view.categoryGrouped;

export default signupSlice.reducer