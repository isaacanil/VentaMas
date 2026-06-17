import { createSlice } from '@reduxjs/toolkit';

import { readLocalStorageBoolean } from '@/utils/storage/localStorage';

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

const VIEW_PRODUCT_IMAGE_DISABLED_KEY = 'viewProductImageDisabled';
const VIEW_PRODUCT_ROW_MODE_KEY = 'viewProductRowMode';
const VIEW_PRODUCT_CATEGORY_GROUPED_KEY = 'viewProductCategoryGrouped';

export const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    handleImageHidden: (state: SettingState) => {
      const imageDisabled = state.userPreference.view.imageHidden;
      localStorage.setItem(
        VIEW_PRODUCT_IMAGE_DISABLED_KEY,
        JSON.stringify(!imageDisabled),
      );
      state.userPreference.view.imageHidden = readLocalStorageBoolean(
        VIEW_PRODUCT_IMAGE_DISABLED_KEY,
        !imageDisabled,
      );
    },
    ReloadImageHiddenSetting: (state: SettingState) => {
      state.userPreference.view.imageHidden = readLocalStorageBoolean(
        VIEW_PRODUCT_IMAGE_DISABLED_KEY,
        state.userPreference.view.imageHidden,
      );
      state.userPreference.view.rowMode = readLocalStorageBoolean(
        VIEW_PRODUCT_ROW_MODE_KEY,
        state.userPreference.view.rowMode,
      );
      state.userPreference.view.categoryGrouped = readLocalStorageBoolean(
        VIEW_PRODUCT_CATEGORY_GROUPED_KEY,
        state.userPreference.view.categoryGrouped,
      );
    },
    handleRowMode: (state: SettingState) => {
      const rowMode = state.userPreference.view.rowMode;
      localStorage.setItem(VIEW_PRODUCT_ROW_MODE_KEY, JSON.stringify(!rowMode));
      state.userPreference.view.rowMode = readLocalStorageBoolean(
        VIEW_PRODUCT_ROW_MODE_KEY,
        !rowMode,
      );
    },
    toggleCategoryGrouped: (state: SettingState) => {
      const categoryGrouped = state.userPreference.view.categoryGrouped;
      localStorage.setItem(
        VIEW_PRODUCT_CATEGORY_GROUPED_KEY,
        JSON.stringify(!categoryGrouped),
      );
      state.userPreference.view.categoryGrouped = readLocalStorageBoolean(
        VIEW_PRODUCT_CATEGORY_GROUPED_KEY,
        !categoryGrouped,
      );
    },
    toggleFullScreen: (state: SettingState) => {
      const fullScreenMode = state.system.fullScreen;

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
export const selectIsRow = (state: SettingRootState) =>
  state.setting.userPreference.view.rowMode;
export const selectFullScreen = (state: SettingRootState) =>
  state.setting.system.fullScreen;
export default settingSlice.reducer;
