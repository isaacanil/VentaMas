import { afterEach, describe, expect, it, vi } from 'vitest';

import reducer, {
  handleImageHidden,
  handleRowMode,
  ReloadImageHiddenSetting,
  toggleCategoryGrouped,
} from './settingSlice';

const VIEW_PRODUCT_IMAGE_DISABLED_KEY = 'viewProductImageDisabled';
const VIEW_PRODUCT_ROW_MODE_KEY = 'viewProductRowMode';
const VIEW_PRODUCT_CATEGORY_GROUPED_KEY = 'viewProductCategoryGrouped';

describe('settingSlice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('writes image hidden and then uses the value read back from storage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key) =>
        key === VIEW_PRODUCT_IMAGE_DISABLED_KEY ? 'true' : null,
      );

    const state = reducer(undefined, handleImageHidden());

    expect(setItemSpy).toHaveBeenCalledWith(
      VIEW_PRODUCT_IMAGE_DISABLED_KEY,
      'false',
    );
    expect(getItemSpy).toHaveBeenCalledWith(VIEW_PRODUCT_IMAGE_DISABLED_KEY);
    expect(state.userPreference.view.imageHidden).toBe(true);
  });

  it('toggles row mode through localStorage', () => {
    const state = reducer(undefined, handleRowMode());

    expect(localStorage.getItem(VIEW_PRODUCT_ROW_MODE_KEY)).toBe('true');
    expect(state.userPreference.view.rowMode).toBe(true);
  });

  it('toggles category grouping through localStorage', () => {
    const state = reducer(undefined, toggleCategoryGrouped());

    expect(localStorage.getItem(VIEW_PRODUCT_CATEGORY_GROUPED_KEY)).toBe(
      'true',
    );
    expect(state.userPreference.view.categoryGrouped).toBe(true);
  });

  it('reloads stored view preferences with the current state as fallback', () => {
    localStorage.setItem(VIEW_PRODUCT_IMAGE_DISABLED_KEY, 'false');
    localStorage.setItem(VIEW_PRODUCT_ROW_MODE_KEY, 'true');
    localStorage.setItem(VIEW_PRODUCT_CATEGORY_GROUPED_KEY, 'true');

    const state = reducer(undefined, ReloadImageHiddenSetting());

    expect(state.userPreference.view).toMatchObject({
      imageHidden: false,
      rowMode: true,
      categoryGrouped: true,
    });
  });
});
