import type { FeatureCardData } from '@/modules/home/pages/Home/components/FeatureCardList/FeatureCard';

import type { LauncherShortcut } from './types';

export const DEFAULT_PINNED_TITLES = [
  'Venta',
  'Facturas',
  'Productos',
  'Cuentas por Cobrar',
  'Cuadre de Caja',
];

export const MAX_PINNED_SHORTCUTS = 6;

export const CATEGORY_ORDER: Record<string, number> = {
  Ventas: 10,
  Inventario: 20,
  Contabilidad: 30,
  'Compras y gastos': 40,
  'RRHH y nomina': 50,
  Contactos: 60,
  Tesorería: 70,
  Administración: 80,
};

export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeSearchFragment = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

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

  let normalizedValue = '';
  const startMap: number[] = [];
  const endMap: number[] = [];
  let originalIndex = 0;

  for (const char of value) {
    const normalizedChar = normalizeSearchFragment(char);
    for (let index = 0; index < normalizedChar.length; index += 1) {
      startMap.push(originalIndex);
      endMap.push(originalIndex + char.length);
    }
    normalizedValue += normalizedChar;
    originalIndex += char.length;
  }

  const normalizedStart = normalizedValue.indexOf(normalizedQuery);
  if (normalizedStart === -1) return null;

  const normalizedEnd = normalizedStart + normalizedQuery.length - 1;

  return {
    end: endMap[normalizedEnd],
    start: startMap[normalizedStart],
  };
};

export const isRoutableFeature = (card: unknown): card is FeatureCardData => {
  if (!card || typeof card !== 'object') return false;
  const candidate = card as Partial<FeatureCardData>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.route === 'string' &&
    candidate.route.trim().length > 0
  );
};

export const toShortcutKey = (
  shortcut: Pick<LauncherShortcut, 'route' | 'title'>,
): string => `${shortcut.route}::${shortcut.title}`;

export const normalizeShortcuts = (cards: unknown): LauncherShortcut[] => {
  if (!Array.isArray(cards)) return [];

  return cards.filter(isRoutableFeature).map((card) => {
    const shortcut = {
      category: card.category,
      icon: card.icon,
      route: card.route ?? '',
      title: card.title,
    };

    return {
      ...shortcut,
      key: toShortcutKey(shortcut),
    };
  });
};

export const uniqueShortcutsByRoute = (
  shortcuts: LauncherShortcut[],
): LauncherShortcut[] => {
  const seenRoutes = new Set<string>();

  return shortcuts.filter((shortcut) => {
    if (seenRoutes.has(shortcut.route)) return false;
    seenRoutes.add(shortcut.route);
    return true;
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
