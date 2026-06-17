import type { FeatureCardData } from '@/modules/home/types/featureCard';
import { normalizeTrimmedSearchText } from '@/utils/searchText';

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

export type RoutableFeatureCardData = FeatureCardData & { route: string };

export const normalizeSearch = (value: string): string =>
  normalizeTrimmedSearchText(value);

export const isFeatureCardData = (card: unknown): card is FeatureCardData => {
  if (!card || typeof card !== 'object') return false;
  const candidate = card as Partial<FeatureCardData>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.category === 'string'
  );
};

export const isRoutableFeatureCardData = (
  card: unknown,
): card is RoutableFeatureCardData => {
  if (!isFeatureCardData(card)) return false;
  return typeof card.route === 'string' && card.route.trim().length > 0;
};

export const normalizeFeatureCardData = (data: unknown): FeatureCardData[] =>
  Array.isArray(data) ? data.filter(isFeatureCardData) : [];

export const normalizeRoutableFeatureCardData = (
  data: unknown,
): RoutableFeatureCardData[] =>
  Array.isArray(data) ? data.filter(isRoutableFeatureCardData) : [];

export const uniqueShortcutsByRoute = <T extends { route?: string }>(
  shortcuts: readonly T[],
): T[] => {
  const seenRoutes = new Set<string>();

  return shortcuts.filter((shortcut) => {
    const route = shortcut.route;
    if (typeof route !== 'string' || route.length === 0) return false;
    if (seenRoutes.has(route)) return false;
    seenRoutes.add(route);
    return true;
  });
};
