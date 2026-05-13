import type { FeatureCardData } from '@/modules/home/pages/Home/components/FeatureCardList/FeatureCard';

import type { LauncherShortcut } from './types';

export const DEFAULT_PINNED_TITLES = [
  'Venta',
  'Facturas',
  'Productos',
  'Cuentas por Cobrar',
  'Cuadre de Caja',
];

export const CATEGORY_ORDER: Record<string, number> = {
  Ventas: 10,
  Inventario: 20,
  Contabilidad: 30,
  'Compras y gastos': 40,
  Contactos: 50,
  Tesorería: 60,
  Administración: 70,
};

export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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
