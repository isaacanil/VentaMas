import { createSlice } from '@reduxjs/toolkit';

interface SettingState {
  status: boolean;
  userPreference: {
    view: {
      imageHidden: boolean;
      rowMode: boolean;
      categoryGrouped: boolean;
    };
  };
  system: {
    isConnected: boolean | undefined;
    fullScreen: boolean;
  };
}

interface SettingRootState {
  setting: SettingState;
}

const initialState: SettingState = {
  status: false,
  userPreference: {
    view: {
      imageHidden: true,
      rowMode: false,
      categoryGrouped: false,
    },
  },
  system: {
    isConnected: undefined,
    fullScreen: false,
  },
};

export const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    handleImageHidden: (state: SettingState) => {
      let imageDisabled = state.userPreference.view.imageHidden;
      localStorage.setItem(
        'viewProductImageDisabled',
        JSON.stringify(!imageDisabled),
      );
      let savedData = localStorage.getItem('viewProductImageDisabled');
      if (savedData) {
        state.userPreference.view.imageHidden = JSON.parse(savedData);
      }
    },
    ReloadImageHiddenSetting: (state: SettingState) => {
      let savedDataImageHidden = localStorage.getItem(
        'viewProductImageDisabled',
      );
      if (savedDataImageHidden) {
        state.userPreference.view.imageHidden = JSON.parse(savedDataImageHidden);
      }
      let savedDataRowMode = localStorage.getItem('viewProductRowMode');
      if (savedDataRowMode) {
        state.userPreference.view.rowMode = JSON.parse(savedDataRowMode);
      }
      let savedDataCategoryGrouped = localStorage.getItem(
        'viewProductCategoryGrouped',
      );
      if (savedDataCategoryGrouped) {
        state.userPreference.view.categoryGrouped = JSON.parse(
          savedDataCategoryGrouped,
        );
      }
    },
    handleRowMode: (state: SettingState) => {
      let rowMode = state.userPreference.view.rowMode;
      localStorage.setItem('viewProductRowMode', JSON.stringify(!rowMode));
      let getData = localStorage.getItem('viewProductRowMode');
      if (getData) {
        state.userPreference.view.rowMode = JSON.parse(getData);
      }
    },
    toggleCategoryGrouped: (state: SettingState) => {
      let categoryGrouped = state.userPreference.view.categoryGrouped;
      localStorage.setItem(
        'viewProductCategoryGrouped',
        JSON.stringify(!categoryGrouped),
      );
      let getData = localStorage.getItem('viewProductCategoryGrouped');
      if (getData) {
        state.userPreference.view.categoryGrouped = JSON.parse(getData);
      }
    },
    toggleFullScreen: (state: SettingState) => {
      let fullScreenMode = state.system.fullScreen;

      state.system.fullScreen = !fullScreenMode;
    },
  },
});

export const {
  handleImageHidden,
  toggleCategoryGrouped,
  ReloadImageHiddenSetting,
  handleRowMode,
  toggleFullScreen,
} = settingSlice.actions;

//selectors
export const selectCategoryGrouped = (state: SettingRootState) =>
  state.setting.userPreference.view.categoryGrouped;
export const selectImageHidden = (state: SettingRootState) =>
  state.setting.userPreference.view.imageHidden;
export const selectIsRow = (state: SettingRootState) => state.setting.userPreference.view.rowMode;
export const selectFullScreen = (state: SettingRootState) => state.setting.system.fullScreen;
export default settingSlice.reducer;
