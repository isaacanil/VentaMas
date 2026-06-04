import { describe, expect, it } from 'vitest';

import type { SettingItem } from '../SettingData';
import {
  buildSettingSearchTokens,
  getSettingItemKey,
  groupSettingItemsByCategory,
  matchesSettingSearchOption,
  normalizeSettingSearchText,
} from './settingSearch';

const buildSettingItem = (
  overrides: Partial<SettingItem> = {},
): SettingItem => ({
  title: 'Comprobante Fiscal',
  description: 'Configuración de comprobante fiscal.',
  type: 'fiscal',
  icon: null,
  category: 'Configuración de la Empresa',
  route: '/app/settings/tax-receipts',
  ...overrides,
});

describe('settingSearch', () => {
  it('normaliza texto ignorando mayusculas y acentos', () => {
    expect(normalizeSettingSearchText('Configuración ÁÉÍÓÚ')).toBe(
      'configuracion aeiou',
    );
  });

  it('usa route como key estable y cae a title cuando falta route', () => {
    expect(getSettingItemKey(buildSettingItem())).toBe(
      '/app/settings/tax-receipts',
    );
    expect(getSettingItemKey(buildSettingItem({ route: '' }))).toBe(
      'Comprobante Fiscal',
    );
  });

  it('agrupa opciones por categoria conservando el orden de entrada', () => {
    const fiscalItem = buildSettingItem();
    const appItem = buildSettingItem({
      title: 'Información de la Aplicación',
      category: 'Aplicación',
    });

    expect(groupSettingItemsByCategory([fiscalItem, appItem])).toEqual({
      'Configuración de la Empresa': [fiscalItem],
      Aplicación: [appItem],
    });
  });

  it('construye tokens y filtra por titulo, descripcion, categoria y tipo', () => {
    const tokens = buildSettingSearchTokens(buildSettingItem());

    expect(matchesSettingSearchOption('fiscal', { searchTokens: tokens })).toBe(
      true,
    );
    expect(
      matchesSettingSearchOption('empresa', { searchTokens: tokens }),
    ).toBe(true);
    expect(
      matchesSettingSearchOption('configuracion', { searchTokens: tokens }),
    ).toBe(true);
    expect(
      matchesSettingSearchOption('usuarios', { searchTokens: tokens }),
    ).toBe(false);
    expect(matchesSettingSearchOption('', { searchTokens: tokens })).toBe(true);
  });
});
