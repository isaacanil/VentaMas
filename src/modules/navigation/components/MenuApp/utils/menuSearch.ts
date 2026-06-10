import type { MenuItem } from '@/types/menu';

export interface MenuSearchItem extends MenuItem {
  searchContextTitle?: string;
}

export type GroupedMenuItems = Record<string, MenuSearchItem[]>;

const normalizeSearchText = (value?: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getMenuItemSearchValue = (item: MenuItem) =>
  normalizeSearchText([item.title, item.label, item.tag?.text].join(' '));

const getMenuItemTitle = (item: MenuItem) =>
  String(item.title ?? item.label ?? '').trim();

const withFallbackGroup = (
  item: MenuItem,
  fallbackGroup: string,
  parentTitles: string[],
): MenuSearchItem => {
  const searchContextTitle = parentTitles.join(' / ');
  const itemWithGroup = item.group ? item : { ...item, group: fallbackGroup };
  if (!searchContextTitle) return itemWithGroup;

  return {
    ...itemWithGroup,
    searchContextTitle,
  };
};

const appendParentTitle = (parentTitles: string[], item: MenuItem) => {
  const itemTitle = getMenuItemTitle(item);
  if (!itemTitle) return parentTitles;
  return [...parentTitles, itemTitle];
};

const getNextFallbackGroup = (item: MenuItem, fallbackGroup: string) => {
  if (item.group) return item;
  return { ...item, group: fallbackGroup };
};

const collectMenuItemMatches = (
  item: MenuItem,
  normalizedQuery: string,
  fallbackGroup: string,
  parentTitles: string[] = [],
): MenuSearchItem[] => {
  const itemWithGroup = getNextFallbackGroup(item, fallbackGroup);
  const itemGroup = itemWithGroup.group ?? fallbackGroup;
  const itemMatches = getMenuItemSearchValue(item).includes(normalizedQuery);
  const submenu = Array.isArray(item.submenu) ? item.submenu : [];
  const submenuMatches = submenu.flatMap((submenuItem) =>
    collectMenuItemMatches(
      submenuItem,
      normalizedQuery,
      itemGroup,
      appendParentTitle(parentTitles, item),
    ),
  );

  if (itemMatches) {
    return [
      withFallbackGroup(item, fallbackGroup, parentTitles),
      ...submenuMatches,
    ];
  }

  return submenuMatches;
};

export const filterGroupedMenuByQuery = (
  groupedMenuItems: GroupedMenuItems,
  query: string,
): GroupedMenuItems => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return groupedMenuItems;

  return Object.entries(groupedMenuItems).reduce<GroupedMenuItems>(
    (acc, [group, items]) => {
      const filteredItems = items.flatMap((item) =>
        collectMenuItemMatches(item, normalizedQuery, group),
      );

      if (filteredItems.length) {
        acc[group] = filteredItems;
      }

      return acc;
    },
    {},
  );
};
