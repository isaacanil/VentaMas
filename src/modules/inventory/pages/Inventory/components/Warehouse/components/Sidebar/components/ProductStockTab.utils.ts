import { replacePathParams } from '@/router/routes/replacePathParams';
import ROUTES_NAME from '@/router/routes/routesName';

export const buildProductStockPath = (productId: string) =>
  replacePathParams(ROUTES_NAME.INVENTORY_TERM.PRODUCT_STOCK, [productId]);
