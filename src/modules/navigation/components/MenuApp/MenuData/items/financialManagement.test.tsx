import { describe, expect, it } from 'vitest';

import ROUTES_NAME from '@/router/routes/routesName';

import financialManagement from './financialManagement';

const findAccountingSubmenuItem = (title: string) => {
  const accountingMenu = financialManagement.find(
    (item) => item.title === 'Contabilidad',
  );

  return accountingMenu?.submenu?.find((item) => item.title === title);
};

describe('financialManagement menu items', () => {
  it('exposes the chart of accounts from the accounting sidebar group', () => {
    expect(findAccountingSubmenuItem('Catálogo de cuentas')).toMatchObject({
      route:
        ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
    });
  });

  it('keeps posting profiles under accounting configuration with the clearer label', () => {
    const accountingConfiguration = findAccountingSubmenuItem(
      'Configuración contable',
    );

    expect(accountingConfiguration?.submenu).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route:
            ROUTES_NAME.SETTING_TERM
              .GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
          title: 'Reglas de contabilización',
        }),
      ]),
    );
  });
});
