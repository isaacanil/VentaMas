import type { FilterBarItem } from './FilterBar';

export type FilterBarItemSlots = {
  mainItems: FilterBarItem[];
  collapsibleMainItems: FilterBarItem[];
  pinnedMainItems: FilterBarItem[];
  additionalItems: FilterBarItem[];
  mobileItems: FilterBarItem[];
};

export type FilterBarOverflowSlots = {
  visibleMainItems: FilterBarItem[];
  collapsedMainItems: FilterBarItem[];
  modalItems: FilterBarItem[];
};

const EMPTY_ITEMS: FilterBarItem[] = [];

export const normalizeFilterBarItems = (
  items: readonly FilterBarItem[] = EMPTY_ITEMS,
): FilterBarItem[] =>
  items.map((item) => ({
    section: 'main',
    visibleOnDesktop: true,
    visibleOnMobile: true,
    collapsible: true,
    ...item,
  }));

export const getFilterBarItemSlots = (
  items: readonly FilterBarItem[] = EMPTY_ITEMS,
): FilterBarItemSlots => {
  const normalizedItems = normalizeFilterBarItems(items);
  const mainItems = normalizedItems.filter(
    (item) => item.section !== 'additional' && item.visibleOnDesktop !== false,
  );
  const collapsibleMainItems = mainItems.filter(
    (item) => item.collapsible !== false,
  );
  const pinnedMainItems = mainItems.filter(
    (item) => item.collapsible === false,
  );
  const additionalItems = normalizedItems.filter(
    (item) => item.section === 'additional' && item.visibleOnDesktop !== false,
  );
  const mobileItems = normalizedItems.filter(
    (item) => item.visibleOnMobile !== false,
  );

  return {
    mainItems,
    collapsibleMainItems,
    pinnedMainItems,
    additionalItems,
    mobileItems,
  };
};

export const getFilterBarOverflowSlots = (
  { additionalItems, collapsibleMainItems }: FilterBarItemSlots,
  visibleCount: number,
): FilterBarOverflowSlots => {
  const visibleMainItems = Number.isFinite(visibleCount)
    ? collapsibleMainItems.slice(0, visibleCount)
    : collapsibleMainItems;
  const collapsedMainItems = Number.isFinite(visibleCount)
    ? collapsibleMainItems.slice(visibleCount)
    : [];

  return {
    visibleMainItems,
    collapsedMainItems,
    modalItems: [...collapsedMainItems, ...additionalItems],
  };
};
