import type { MenuItem } from '../types';

export const findMenuItemByKey = (
  items: MenuItem[],
  key: string,
): MenuItem | null => {
  for (const item of items) {
    if (item.key === key) {
      return item;
    }

    if (item.children?.length) {
      const nestedMatch = findMenuItemByKey(item.children, key);
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
};

export const hasActiveDescendant = (
  item: MenuItem,
  activeKey: string,
): boolean =>
  item.children?.some(
    (child) => child.key === activeKey || hasActiveDescendant(child, activeKey),
  ) ?? false;
