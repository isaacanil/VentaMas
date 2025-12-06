import { useFilterMenuItemsByAccess } from '../../../../utils/menuAccess';

import admin from './items/admin';
import basic from './items/basic';
import changelogs from './items/changelogs';
import contacts from './items/contacts';
import developer from './items/developer';
import financialManagement from './items/financialManagement';
import insurance from './items/insurance';
import inventory from './items/inventory';
import sales from './items/sales';
import utility from './items/utility';

export const useMenuData = () => {
  const allMenuItems = [
    ...basic,
    ...sales,
    ...inventory,
    ...financialManagement,
    ...insurance,
    ...contacts,
    ...utility,
    ...admin,
    ...changelogs,
    ...developer,
  ];

  return useFilterMenuItemsByAccess(allMenuItems, true);
};
