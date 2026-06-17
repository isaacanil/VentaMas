export { Carrusel } from './components/Carrusel/Carrusel';
export { AddProductButton } from './components/AddProductButton';
export {
  closeBrandModal,
  default as productBrandReducer,
  openBrandModal,
  selectProductBrandModal,
} from './state/productBrandSlice';
export { ProductCategoryBar } from './components/ProductCategoryBar/ProductCategoryBar';
export { ProductQRCode } from './components/ProductQRCode';
export { productStudioProductEditorAdapters } from './devTools/productStudioProductEditorAdapters';

export const loadActiveIngredientModal = () =>
  import('./components/ActiveIngredientModal/ActiveIngredientModal');

export const loadProductBrandModal = () =>
  import('./components/ProductBrandModal/ProductBrandModal');

export const loadProductEditorModal = () =>
  import('./components/ProductEditorModal/ProductEditorModal').then(
    (module) => ({
      default: module.ProductEditorModal,
    }),
  );
