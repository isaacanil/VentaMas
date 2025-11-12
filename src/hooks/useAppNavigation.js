import { useNavigate } from 'react-router-dom';

import { replacePathParams } from '../routes/replacePathParams';
import ROUTES_NAME from '../routes/routesName';

export function useAppNavigation() {
  const navigate = useNavigate();

  const navigateTo = {
    // Rutas básicas
    home: () => navigate(ROUTES_NAME.BASIC_TERM.HOME),
    welcome: () => navigate(ROUTES_NAME.BASIC_TERM.WELCOME),

    // Autenticación
    login: () => navigate(ROUTES_NAME.AUTH_TERM.LOGIN),
    signup: () => navigate(ROUTES_NAME.AUTH_TERM.SIGNUP),

    // Ventas
    sales: () => navigate(ROUTES_NAME.SALES_TERM.SALES),
    bills: () => navigate(ROUTES_NAME.SALES_TERM.BILLS),
    preorders: () => navigate(ROUTES_NAME.SALES_TERM.PREORDERS),

    // Configuración
    settings: () => navigate(ROUTES_NAME.SETTING_TERM.SETTINGS),
    setting: () => navigate(ROUTES_NAME.SETTING_TERM.SETTING),
    users: () => navigate(ROUTES_NAME.SETTING_TERM.USERS),
    appInfo: () => navigate(ROUTES_NAME.SETTING_TERM.APP_INFO),
    businessInfo: () => navigate(ROUTES_NAME.SETTING_TERM.BUSINESS_INFO),
    taxReceipt: () => navigate(ROUTES_NAME.SETTING_TERM.TAX_RECEIPT),

    // Inventario
    createProduct: () => navigate(ROUTES_NAME.INVENTORY_TERM.CREATE_PRODUCT),
    product: (productId) =>
      navigate(
        replacePathParams(ROUTES_NAME.INVENTORY_TERM.PRODUCT, productId),
      ),
    inventoryItems: () => navigate(ROUTES_NAME.INVENTORY_TERM.INVENTORY_ITEMS),
    categories: () => navigate(ROUTES_NAME.INVENTORY_TERM.CATEGORIES),
    warehouses: () => navigate(ROUTES_NAME.INVENTORY_TERM.WAREHOUSES),
    warehouse: (warehouseId) =>
      navigate(
        replacePathParams(ROUTES_NAME.INVENTORY_TERM.WAREHOUSE, warehouseId),
      ),

    // Cuentas por cobrar
    accountReceivableList: () =>
      navigate(ROUTES_NAME.ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST),
    accountReceivableInfo: (id) =>
      navigate(
        replacePathParams(
          ROUTES_NAME.ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_INFO,
          id,
        ),
      ),
    receivablePaymentReceipts: () =>
      navigate(ROUTES_NAME.ACCOUNT_RECEIVABLE.RECEIVABLE_PAYMENT_RECEIPTS),

    // Compras
    purchases: () => navigate(ROUTES_NAME.PURCHASE_TERM.PURCHASES),
    purchasesCreate: () => navigate(ROUTES_NAME.PURCHASE_TERM.PURCHASES_CREATE),
    purchasesUpdate: (id) =>
      navigate(
        replacePathParams(ROUTES_NAME.PURCHASE_TERM.PURCHASES_UPDATE, id),
      ),
    purchasesComplete: (id) =>
      navigate(
        replacePathParams(ROUTES_NAME.PURCHASE_TERM.PURCHASES_COMPLETE, id),
      ),
    backorders: () => navigate(ROUTES_NAME.PURCHASE_TERM.BACKORDERS),

    // Aseguradoras
    insuranceConfig: () =>
      navigate(ROUTES_NAME.INSURANCE_TERM.INSURANCE_CONFIG),
    insuranceList: () => navigate(ROUTES_NAME.INSURANCE_TERM.INSURANCE_LIST),
    insuranceCreate: () =>
      navigate(ROUTES_NAME.INSURANCE_TERM.INSURANCE_CREATE),
    insuranceEdit: (id) =>
      navigate(
        replacePathParams(ROUTES_NAME.INSURANCE_TERM.INSURANCE_EDIT, id),
      ),
    insuranceDetails: (id) =>
      navigate(
        replacePathParams(ROUTES_NAME.INSURANCE_TERM.INSURANCE_DETAILS, id),
      ),
  };

  return navigateTo;
}
