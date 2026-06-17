import { createSlice } from '@reduxjs/toolkit';

import {
  readStoredCategoryGrouped,
  readStoredImageHidden,
  readStoredRowMode,
  writeStoredCategoryGrouped,
  writeStoredImageHidden,
  writeStoredRowMode,
} from './utils/settingStorage';

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
      const imageDisabled = state.userPreference.view.imageHidden;
      writeStoredImageHidden(!imageDisabled);
      state.userPreference.view.imageHidden =
        readStoredImageHidden(!imageDisabled);
    },
    ReloadImageHiddenSetting: (state: SettingState) => {
      state.userPreference.view.imageHidden = readStoredImageHidden(
        state.userPreference.view.imageHidden,
      );
      state.userPreference.view.rowMode = readStoredRowMode(
        state.userPreference.view.rowMode,
      );
      state.userPreference.view.categoryGrouped = readStoredCategoryGrouped(
        state.userPreference.view.categoryGrouped,
      );
    },
    handleRowMode: (state: SettingState) => {
      const rowMode = state.userPreference.view.rowMode;
      writeStoredRowMode(!rowMode);
      state.userPreference.view.rowMode = readStoredRowMode(!rowMode);
    },
    toggleCategoryGrouped: (state: SettingState) => {
      const categoryGrouped = state.userPreference.view.categoryGrouped;
      writeStoredCategoryGrouped(!categoryGrouped);
      state.userPreference.view.categoryGrouped =
        readStoredCategoryGrouped(!categoryGrouped);
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
