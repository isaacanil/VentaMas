import { CashReconciliation } from "../../../pages/CashReconciliation/CashReconciliation";
import { CashReconciliationToolbar } from "./Page/CashReconciliationToolbar";
import { InventoryMenuToolbar } from "./Page/InventoryMenuToolbar";
import UsersAdminToolbar from "./Page/UsersAdminToolbar";
import { VentaMenuToolbar } from "./Page/VentaMenuToolBar";

const componentsConfig = [
  {
    id: 'ventaMenuToolBar',
    component: VentaMenuToolbar,
  },
  {
    id: 'inventoryMenuToolBar',
    component: InventoryMenuToolbar,
  },
  {
    id: 'usersAdminToolBar',
    component: UsersAdminToolbar,
  },
  {
    id: 'cashReconciliationToolBar',
    component: CashReconciliationToolbar
  }
];

const generateToolbarConfig = (side) =>
  componentsConfig.map((component) => ({
    ...component,
    id: `${component.id}${side}`,
    side,
  }));

export const toolbarConfig = {
  leftSide: generateToolbarConfig('left'),
  rightSide: generateToolbarConfig('right'),
};