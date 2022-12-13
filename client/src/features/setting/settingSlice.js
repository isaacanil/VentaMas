import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    status: false,
    userPreference: {
        view: {
            imageHidden: false,
        }
    }
}

export const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers: {
        handleImageHidden: (state) => {
            let imageDisabled = state.userPreference.view.imageHidden
            localStorage.setItem('viewProductImageDisabled', JSON.stringify(!imageDisabled))
            let savedDate = localStorage.getItem('viewProductImageDisabled')
         
            state.userPreference.view.imageHidden = JSON.parse(savedDate)  
        }
        
    }
})

export const { handleImageHidden } = settingSlice.actions;

//selectors
export const selectImageHidden = (state) => state.setting.userPreference.view.imageHidden;
export default settingSlice.reducer