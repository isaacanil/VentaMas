export const loadSetCustomProductModal = () =>
  import('./components/CustomProductModal/setCustomProduct/SetCustomProduct').then(
    (module) => ({
      default: module.SetCustomProduct,
    }),
  );

export const loadPreorderSaleRoute = () =>
  import('./pages/PreorderSale/PreorderSale').then((module) => ({
    default: module.Preorder,
  }));

export const loadSalesRoute = () =>
  import('./pages/Sale/Sale').then((module) => ({
    default: module.Sales,
  }));
