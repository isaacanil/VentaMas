import { filterMenuItemsByAccess } from '../../../../utils/menuAccess';

import accountsReceivable from './items/accountsReceivable';
import admin from './items/admin';
import basic from './items/basic';
import changelogs from './items/changelogs';
import contacts from './items/contacts';
import creditNote from './items/creditNote';
import developer from './items/developer';
import financialManagement from './items/financialManagement';
import insurance from './items/insurance';
import inventory from './items/inventory';
import sales from './items/sales';
import utility from './items/utility';

export const getMenuData = () => {
  const allMenuItems = [
    ...basic,
    ...sales,
    ...insurance,
    ...inventory,
    ...accountsReceivable,
    ...financialManagement,
    ...utility,
    ...contacts,
    ...admin,
    ...changelogs,
    ...creditNote,
    ...developer,
  ];

  return filterMenuItemsByAccess(allMenuItems, true);
};
