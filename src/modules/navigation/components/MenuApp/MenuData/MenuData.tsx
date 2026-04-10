import type { MenuItem } from '@/types/menu';
import { useBusinessFeatureEnabled } from '@/hooks/useBusinessFeatureEnabled';
import ROUTES_NAME from '@/router/routes/routesName';
import { routePreloaders } from '@/router/routes/routePreloaders';
import { useFilterMenuItemsByAccess } from '@/utils/menuAccess';

import admin from './items/admin';
import basic from './items/basic';
import changelogs from './items/changelogs';
import contacts from './items/contacts';
import developer from './items/developer';
import financialManagement from './items/financialManagement';
import insurance from './items/insurance';
import inventory from './items/inventory';
import sales from './items/sales';
import treasury from './items/treasury';
import utility from './items/utility';

const attachPreloaders = (item: MenuItem): MenuItem => {
  const preload = item?.route ? routePreloaders[item.route] : undefined;
  const nextItem: MenuItem = preload ? { ...item, preload } : { ...item };

  if (nextItem.submenu && Array.isArray(nextItem.submenu)) {
    nextItem.submenu = nextItem.submenu.map(attachPreloaders);
  }

  return nextItem;
};

export const useMenuData = () => {
  const accountingEnabled = useBusinessFeatureEnabled('accounting');
  const treasuryEnabled = useBusinessFeatureEnabled('treasury');
  const { TREASURY_BANK_ACCOUNTS } = ROUTES_NAME.TREASURY_TERM;
  const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM;
  const allMenuItems: MenuItem[] = [
    ...basic,
    ...sales,
    ...inventory,
    ...financialManagement,
    ...treasury,
    ...insurance,
    ...contacts,
    ...utility,
    ...admin,
    ...changelogs,
    ...developer,
  ];

  const visibleMenuItems = allMenuItems.filter((item) => {
    if (item.group === 'treasury' && !treasuryEnabled) {
      return false;
    }

    if (item.route === TREASURY_BANK_ACCOUNTS && !accountingEnabled) {
      return false;
    }

    if (item.route === CASH_RECONCILIATION_LIST) {
      return treasuryEnabled;
    }

    if (accountingEnabled) return true;
    return item.title !== 'Contabilidad';
  });

  const menuItemsWithPreloaders = visibleMenuItems.map(attachPreloaders);

  return useFilterMenuItemsByAccess(menuItemsWithPreloaders, true);
};
