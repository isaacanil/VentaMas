import {
  isRoutableFeatureCardData,
  normalizeSearch,
} from '@/modules/home/utils/homeShortcutUtils';
import { buildSearchIndex } from '@/utils/searchText';

import type { LauncherShortcut } from './types';

export const DEFAULT_PINNED_TITLES = [
  'Venta',
  'Facturas',
  'Productos',
  'Cuentas por Cobrar',
  'Cuadre de Caja',
];

export const MAX_PINNED_SHORTCUTS = 6;

export interface SearchMatchRange {
  end: number;
  start: number;
}

export const findSearchMatchRange = (
  value: string,
  query: string,
): SearchMatchRange | null => {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return null;

  const { normalized: normalizedValue, ranges } = buildSearchIndex(value);

  const normalizedStart = normalizedValue.indexOf(normalizedQuery);
  if (normalizedStart === -1) return null;

  const normalizedEnd = normalizedStart + normalizedQuery.length - 1;
  const start = ranges[normalizedStart]?.start;
  const end = ranges[normalizedEnd]?.end;

  if (typeof start !== 'number' || typeof end !== 'number') {
    return null;
  }

  return {
    end,
    start,
  };
};

export const toShortcutKey = (
  shortcut: Pick<LauncherShortcut, 'route' | 'title'>,
): string => `${shortcut.route}::${shortcut.title}`;

export const normalizeShortcuts = (cards: unknown): LauncherShortcut[] => {
  if (!Array.isArray(cards)) return [];

  return cards.filter(isRoutableFeatureCardData).map((card) => {
    const shortcut = {
      category: card.category,
      icon: card.icon,
      route: card.route,
      title: card.title,
    };

    return {
      ...shortcut,
      key: toShortcutKey(shortcut),
    };
  });
};

export const getInitialPinnedKeys = (
  shortcuts: LauncherShortcut[],
): string[] => {
  const byTitle = new Map(
    shortcuts.map((shortcut) => [shortcut.title, shortcut]),
  );
  const preferred = DEFAULT_PINNED_TITLES.map((title) => byTitle.get(title))
    .filter((shortcut): shortcut is LauncherShortcut => Boolean(shortcut))
    .map((shortcut) => shortcut.key);

  return preferred.length > 0
    ? preferred
    : shortcuts
        .slice(0, DEFAULT_PINNED_TITLES.length)
        .map((shortcut) => shortcut.key);
};
