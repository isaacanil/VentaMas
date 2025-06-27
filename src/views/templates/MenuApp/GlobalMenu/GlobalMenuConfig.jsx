import { CashReconciliation } from "../../../pages/CashReconciliation/CashReconciliation";
import BusinessManagerToolbar from "./Page/BusinessManageToolbar";
import { CashReconciliationToolbar } from "./Page/CashReconciliationToolbar";
import { ClientControlToolbar } from "./Page/ClientControlToolbar";
import { CreateOrderToolbar } from "./Page/CreateOrderToolbar";
import { CreatePurchaseToolbar } from "./Page/CreatePurchaseToolbar";
import { ExpensesCategoriesToolbar } from "./Page/ExpensesCategoriesToolbar";
import { ExpensesListToolbar } from "./Page/ExpensesListToolbar";
import GeneralConfigToolbar from "./Page/GeneralConfigToolbar";
import { InsuranceConfigToolbar } from "./Page/InsuranceConfigToolbar";
import { InventoryMenuToolbar } from "./Page/InventoryMenuToolbar/InventoryMenuToolbar";
import { OrderToolbar } from "./Page/OrderToolbar";
import { PreorderMenuToolbar } from "./Page/PreorderMenuToolbar";
import { ProductCategoriesToolbar } from "./Page/ProductCategoriesToolbar";
import { PurchaseToolbar } from "./Page/PurchaseToolbar";
import { RegistroToolbar } from "./Page/RegistroToolbar";
import UsersAdminToolbar from "./Page/UsersAdminToolbar";
import { VentaMenuToolbar } from "./Page/VentaMenuToolbar";
import { WarehouseToolbar } from "./Page/WarehouseToolbar";
import { AccountReceivableToolbar } from "./Page/AccountReceivableToolbar/AccountReceivableToolbar";
import { CreditNoteToolbar } from "./Page/CreditNoteToolbar";

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
    id: 'accountReceivableToolBar',
    component: AccountReceivableToolbar
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
  },
  {
    id: 'productsCategoriesToolBar',
    component: ProductCategoriesToolbar
  },
  {
    id: 'expensesCategoriesToolBar',
    component: ExpensesCategoriesToolbar
  },
  {
    id: 'expensesListToolBar',
    component: ExpensesListToolbar
  },
  {
    id: 'clientControlToolBar',
    component: ClientControlToolbar
  },
  {
    id: 'warehouseToolBar',
    component: WarehouseToolbar
  },
  {
    id: 'preorderToolBar',
    component: PreorderMenuToolbar
  },
  {
    id: 'businessManagementToolBar',
    component: BusinessManagerToolbar
  },
  {
    id: 'insuranceConfigToolBar',
    component: InsuranceConfigToolbar
  },
  {
    id: 'generalConfigToolBar',
    component: GeneralConfigToolbar
  },
  {
    id: 'creditNoteToolBar',
    component: CreditNoteToolbar
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