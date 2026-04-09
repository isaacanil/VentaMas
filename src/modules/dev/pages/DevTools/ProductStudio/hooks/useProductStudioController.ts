import { Form, message, notification } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCategoryState } from '@/Context/CategoryContext/useCategoryState';
import { openModal as openActiveIngredientModal } from '@/features/activeIngredients/activeIngredientsSlice';
import { selectUser } from '@/features/auth/userSlice';
import { openBrandModal } from '@/features/productBrands/productBrandSlice';
import {
  ChangeProductData,
  changeProductPrice,
  clearUpdateProductData,
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';
import { useFbGetCategories } from '@/firebase/categories/useFbGetCategories';
import { useListenActiveIngredients } from '@/firebase/products/activeIngredient/activeIngredients';
import { useListenProductBrands } from '@/firebase/products/brands/productBrands';
import { fbAddProduct } from '@/firebase/products/fbAddProduct';
import { fbGetProduct } from '@/firebase/products/fbGetProduct';
import { fbUpdateProduct } from '@/firebase/products/fbUpdateProduct';
import { buildSanitizedProductForSubmit } from '@/utils/products/normalization';

import {
  useProductPreviewMetrics,
  type ProductSnapshot,
} from './useProductPreviewMetrics';
import type {
  PricingValues,
  ProductFormValues,
} from '../components/form/ProductForm';
import { brandFieldMetaByType, buildBrandOptions } from '../utils/brandUtils';
import {
  FORM_SECTIONS,
  getSectionDomId,
  type SectionId,
} from '../utils/sections';
import {
  getChangedProductPatch,
  getNormalizedProductValues,
  hasBusinessId,
  hasUserUid,
  isFormValidationError,
  normalizePricingForForm,
  normalizePricingForUpdate,
  toProductPreviewSnapshot,
} from '../utils/productStudioForm';
import type { ProductRecord } from '@/types/products';

type UserRootState = Parameters<typeof selectUser>[0];
type UpdateProductStatus = false | 'create' | 'update';

interface UpdateProductState {
  status: UpdateProductStatus;
  product: ProductRecord;
}

interface UpdateProductRootState {
  updateProduct: UpdateProductState;
}

const BRAND_DEFAULT_FORM_VALUE = 'default';

const getFieldKey = (
  changedValues: Partial<ProductFormValues>,
): keyof ProductFormValues | null => {
  const [key] = Object.keys(changedValues) as Array<keyof ProductFormValues>;
  return key ?? null;
};

export const useProductStudioController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(
    selectUser,
  );
  const { product, status } = useSelector<
    UpdateProductRootState,
    UpdateProductState
  >(selectUpdateProductData);
  const [form] = Form.useForm<ProductFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [imageDrawerVisible, setImageDrawerVisible] = useState(false);
  const [navigationVisible, setNavigationVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const lastLoadedProductIdRef = useRef<string | null>(null);
  const { categories } = useFbGetCategories();
  const { data: productBrands = [] } = useListenProductBrands();
  const { data: activeIngredients = [] } = useListenActiveIngredients();
  const { configureAddProductCategoryModal } = useCategoryState();

  const productIdFromParams = useMemo(
    () => new URLSearchParams(location.search).get('productId') || '',
    [location.search],
  );
  const isUpdateMode = Boolean(productIdFromParams);

  const normalizedProduct = useMemo(
    () => getNormalizedProductValues(product),
    [product],
  );
  const brandMeta = useMemo(
    () => brandFieldMetaByType(product?.type),
    [product?.type],
  );
  const normalizedProductBrands = useMemo(
    () =>
      productBrands.map((brand) => ({
        id: brand.id,
        name: typeof brand.name === 'string' ? brand.name : '',
      })),
    [productBrands],
  );
  const brandOptions = useMemo(
    () => buildBrandOptions(normalizedProductBrands, product),
    [normalizedProductBrands, product],
  );
  const previewSnapshot = useMemo<ProductSnapshot | null | undefined>(
    () => toProductPreviewSnapshot(product),
    [product],
  );
  const previewMetrics = useProductPreviewMetrics(previewSnapshot);
  const sectionDomIds = useMemo(
    () =>
      FORM_SECTIONS.reduce<Record<SectionId, string>>((acc, section) => {
        acc[section.id] = getSectionDomId(section.id);
        return acc;
      }, {} as Record<SectionId, string>),
    [],
  );

  const updateUrlProductId = useCallback(
    (nextId: string) => {
      const params = new URLSearchParams(location.search);
      if (nextId) {
        params.set('productId', nextId);
      } else {
        params.delete('productId');
      }
      const searchString = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: searchString ? `?${searchString}` : '',
        },
        { replace: true },
      );
    },
    [location.pathname, location.search, navigate],
  );

  const resetToCreateState = useCallback(
    ({ skipUrlUpdate = false }: { skipUrlUpdate?: boolean } = {}) => {
      dispatch(clearUpdateProductData());
      dispatch(ChangeProductData({ status: 'create', product: {} }));
      form.resetFields();
      if (!skipUrlUpdate) {
        updateUrlProductId('');
      }
      lastLoadedProductIdRef.current = null;
    },
    [dispatch, form, updateUrlProductId],
  );

  const loadProductById = useCallback(
    (
      rawId: string | null | undefined,
      {
        skipUrlUpdate = false,
        quiet = false,
      }: { skipUrlUpdate?: boolean; quiet?: boolean } = {},
    ): Promise<boolean> => {
      const value = rawId?.trim();
      if (!value) {
        if (!quiet) {
          message.warning('Introduce un ID de producto válido.');
        }
        return Promise.resolve(false);
      }
      if (!hasBusinessId(user)) {
        message.error('No se pudo determinar el negocio activo.');
        return Promise.resolve(false);
      }
      return fbGetProduct(user, value)
        .then((existingProduct) => {
          if (!existingProduct) {
            message.error('No encontramos un producto con ese identificador.');
            return false;
          }
          dispatch(
            ChangeProductData({ status: 'update', product: existingProduct }),
          );
          if (!quiet) {
            message.success(
              `Producto "${existingProduct.name || existingProduct.productName}" listo para editar.`,
            );
          }
          if (!skipUrlUpdate) {
            updateUrlProductId(value);
          }
          lastLoadedProductIdRef.current = value;
          return true;
        })
        .catch((error) => {
          console.error('Error cargando producto:', error);
          message.error('No se pudo recuperar el producto.');
          return false;
        });
    },
    [dispatch, updateUrlProductId, user],
  );

  useEffect(() => {
    form.setFieldsValue(normalizedProduct);
  }, [normalizedProduct, form]);

  useEffect(() => {
    if (productIdFromParams) {
      if (productIdFromParams !== lastLoadedProductIdRef.current) {
        void loadProductById(productIdFromParams, {
          skipUrlUpdate: true,
          quiet: true,
        });
      }
      return;
    }
    if (lastLoadedProductIdRef.current) {
      resetToCreateState({ skipUrlUpdate: true });
    }
  }, [productIdFromParams, loadProductById, resetToCreateState]);

  const handleValuesChange = useCallback(
    (changedValues: Partial<ProductFormValues>) => {
      const key = getFieldKey(changedValues);
      if (!key) return;
      const value = changedValues[key];

      if (key === 'pricing') {
        const currentPricing = normalizePricingForForm(product?.pricing) || {};
        const normalizedPricing: PricingValues =
          value && typeof value === 'object'
            ? { ...currentPricing, ...(value as PricingValues) }
            : { ...currentPricing };
        dispatch(
          changeProductPrice({
            pricing: normalizePricingForUpdate(normalizedPricing),
          }),
        );
        return;
      }

      const patch = getChangedProductPatch({
        key,
        value,
        product,
        productBrands,
      });
      if (!patch) return;

      dispatch(ChangeProductData({ product: patch }));

      if (key === 'itemType') {
        form.setFieldsValue({
          itemType: patch.itemType,
          trackInventory: patch.trackInventory,
        });
      }

      if (key === 'brand' && value !== patch.brand) {
        form.setFieldsValue({ brand: patch.brand });
      }

      if (
        key === 'brandId' &&
        (!patch.brandId || patch.brandId === BRAND_DEFAULT_FORM_VALUE)
      ) {
        form.setFieldsValue({ brandId: BRAND_DEFAULT_FORM_VALUE });
      }
    },
    [dispatch, form, product, productBrands],
  );

  const handleSubmit = useCallback(() => {
    if (!user) {
      message.error('No se encontró la sesión del usuario.');
      return;
    }
    if (!hasBusinessId(user)) {
      message.error('No se pudo determinar el negocio activo.');
      return;
    }

    setSubmitting(true);
    form
      .validateFields()
      .then(async () => {
        const sanitizedProduct = buildSanitizedProductForSubmit(product);
        if (!sanitizedProduct) {
          throw new Error('No hay datos de producto para guardar.');
        }

        if (isUpdateMode || status === 'update') {
          const productId =
            typeof sanitizedProduct.id === 'string' &&
            sanitizedProduct.id.trim()
              ? sanitizedProduct.id
              : product?.id;
          if (!productId) {
            throw new Error(
              'El producto no tiene un identificador válido para actualizar.',
            );
          }
          await fbUpdateProduct({ ...sanitizedProduct, id: productId }, user);
          notification.success({
            message: 'Producto actualizado',
            description:
              'Los cambios están disponibles para el equipo en segundos.',
          });
          return;
        }

        if (!hasUserUid(user)) {
          throw new Error('No se pudo determinar el usuario activo.');
        }

        await fbAddProduct(
          {
            ...sanitizedProduct,
            stock:
              typeof sanitizedProduct.stock === 'number'
                ? sanitizedProduct.stock
                : Number(sanitizedProduct.stock ?? 0),
          },
          user,
        );
        notification.success({
          message: 'Producto creado',
          description:
            'El nuevo producto ya está disponible para ventas e inventario.',
        });
        resetToCreateState();
      })
      .catch((err: unknown) => {
        if (isFormValidationError(err) && err.errorFields.length > 0) {
          const messages = err.errorFields
            .map((fieldError) =>
              Array.isArray(fieldError.errors) ? fieldError.errors[0] : '',
            )
            .filter(Boolean);

          notification.error({
            message: 'Revisa los campos del formulario',
            description:
              messages.length > 0
                ? messages.join(' · ')
                : 'Hay valores pendientes por completar.',
            duration: 10,
          });

          const firstName = err.errorFields[0]?.name;
          if (firstName) {
            form.scrollToField(firstName, {
              behavior: 'smooth',
              block: 'center',
            });
          }
          return;
        }

        console.error('Error guardando el producto:', err);
        notification.error({
          message: 'No se pudo guardar',
          description:
            err instanceof Error
              ? err.message
              : 'Intenta nuevamente en unos segundos.',
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [form, isUpdateMode, product, resetToCreateState, status, user]);

  const handleReset = useCallback(() => {
    resetToCreateState();
  }, [resetToCreateState]);

  const handleOpenBrandModal = useCallback(() => {
    dispatch(openBrandModal({ initialValues: null }));
  }, [dispatch]);

  const handleResetImage = useCallback(() => {
    dispatch(ChangeProductData({ product: { image: '' } }));
  }, [dispatch]);

  const handleToggleNavigation = useCallback(() => {
    setNavigationVisible((prev) => !prev);
  }, []);

  const handleToggleSummary = useCallback(() => {
    setSummaryVisible((prev) => !prev);
  }, []);

  const handleAddActiveIngredient = useCallback(() => {
    dispatch(openActiveIngredientModal({ initialValues: null }));
  }, [dispatch]);

  const handleOpenImageManager = useCallback(() => {
    setImageDrawerVisible(true);
  }, []);

  const handleCloseImageManager = useCallback(() => {
    setImageDrawerVisible(false);
  }, []);

  const handleCancel = useCallback(() => {
    navigate('/inventory/items');
  }, [navigate]);

  return {
    form,
    product,
    categories,
    activeIngredients,
    previewSnapshot,
    previewMetrics,
    brandMeta,
    brandOptions,
    sectionDomIds,
    configureAddProductCategoryModal,
    handleValuesChange,
    handleOpenBrandModal,
    handleAddActiveIngredient,
    handleOpenImageManager,
    handleCloseImageManager,
    handleResetImage,
    handleToggleNavigation,
    handleToggleSummary,
    handleReset,
    handleSubmit,
    handleCancel,
    imageDrawerVisible,
    isUpdateMode,
    navigationVisible,
    submitting,
    summaryVisible,
  };
};
