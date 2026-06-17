import { readLocalStorageBoolean } from '@/utils/storage/localStorage';

const VIEW_PRODUCT_IMAGE_DISABLED_KEY = 'viewProductImageDisabled';
const VIEW_PRODUCT_ROW_MODE_KEY = 'viewProductRowMode';
const VIEW_PRODUCT_CATEGORY_GROUPED_KEY = 'viewProductCategoryGrouped';

const writeStoredBoolean = (key: string, value: boolean) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const readStoredImageHidden = (fallback: boolean) =>
  readLocalStorageBoolean(VIEW_PRODUCT_IMAGE_DISABLED_KEY, fallback);

export const writeStoredImageHidden = (value: boolean) => {
  writeStoredBoolean(VIEW_PRODUCT_IMAGE_DISABLED_KEY, value);
};

export const readStoredRowMode = (fallback: boolean) =>
  readLocalStorageBoolean(VIEW_PRODUCT_ROW_MODE_KEY, fallback);

export const writeStoredRowMode = (value: boolean) => {
  writeStoredBoolean(VIEW_PRODUCT_ROW_MODE_KEY, value);
};

export const readStoredCategoryGrouped = (fallback: boolean) =>
  readLocalStorageBoolean(VIEW_PRODUCT_CATEGORY_GROUPED_KEY, fallback);

export const writeStoredCategoryGrouped = (value: boolean) => {
  writeStoredBoolean(VIEW_PRODUCT_CATEGORY_GROUPED_KEY, value);
};
