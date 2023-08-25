import { CashReconciliation } from "../../../pages/CashReconciliation/CashReconciliation";
import { CashReconciliationToolbar } from "./Page/CashReconciliationToolbar";
import { CreateOrderToolbar } from "./Page/CreateOrderToolbar";
import { CreatePurchaseToolbar } from "./Page/CreatePurchaseToolbar";
import { InventoryMenuToolbar } from "./Page/InventoryMenuToolbar";
import { OrderToolbar } from "./Page/OrderToolbar";
import { PurchaseToolbar } from "./Page/PurchaseToolbar";
import { RegistroToolbar } from "./Page/RegistroToolbar";
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
  },
  {
    id: 'purchaseToolBar',
    component: PurchaseToolbar
  },
  {
    id: 'orderToolBar',
    component: OrderToolbar
  },
  {
    id: 'createOrderToolBar',
    component: CreateOrderToolbar
  },
  {
    id: 'createPurchaseToolBar',
    component: CreatePurchaseToolbar
  },
  {
    id: 'billToolBar',
    component: RegistroToolbar
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