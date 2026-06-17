import { normalizeSearchText } from '@/utils/searchText';

import type { SettingItem } from '../SettingData';

export type SettingSearchableOption = {
  searchTokens?: string[];
};

export const normalizeSettingSearchText = normalizeSearchText;

export const getSettingItemKey = (item: Pick<SettingItem, 'route' | 'title'>) =>
  item.route || item.title;

export const groupSettingItemsByCategory = (items: SettingItem[]) => {
  return items.reduce<Record<string, SettingItem[]>>((acc, item) => {
    if (acc[item.category]) {
      acc[item.category].push(item);
    } else {
      acc[item.category] = [item];
    }

    return acc;
  }, {});
};

export const buildSettingSearchTokens = (item: SettingItem) =>
  [
    normalizeSettingSearchText(item.title),
    normalizeSettingSearchText(item.description),
    normalizeSettingSearchText(item.category),
    normalizeSettingSearchText(item.type),
  ].filter(Boolean);

export const matchesSettingSearchOption = (
  inputValue: string,
  option?: SettingSearchableOption,
) => {
  if (!inputValue) return true;

  const normalizedValue = normalizeSettingSearchText(inputValue);
  if (!normalizedValue) return true;

  return Boolean(
    option?.searchTokens?.some((token) => token.includes(normalizedValue)),
  );
};
