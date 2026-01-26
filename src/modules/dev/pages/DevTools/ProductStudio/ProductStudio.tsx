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
  PRODUCT_BRAND_DEFAULT,
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
import {
  BRAND_DEFAULT_OPTION_VALUE,
  BRAND_LEGACY_OPTION_VALUE,
} from '@/components/modals/ProductForm/constants/brandOptions';
import ImageManager from '@/components/modals/ProductForm/ImageManager/ImageManager';
import {
  buildNormalizedProductSnapshot,
  buildSanitizedProductForSubmit,
  normalizeItemType,
  normalizeTrackInventoryValue,
} from '@/utils/products/normalization';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { ActionBar } from './components/ActionBar';
import { ProductForm } from './components/form/ProductForm';
import { ModeBanner } from './components/ModeBanner';
import { ProductSummary } from './components/ProductSummary';
import { SectionNavigator } from './components/SectionNavigator';
import {
  PageContainer,
  ScrollArea,
  StudioGrid,
  StudioWrapper,
  StickySummary,
  Workspace,
} from './components/StudioLayout';
import { useProductPreviewMetrics, type ProductSnapshot } from './hooks/useProductPreviewMetrics';
import { useSectionNavigation } from './hooks/useSectionNavigation';
import { brandFieldMetaByType, buildBrandOptions } from './utils/brandUtils';
import { FORM_SECTIONS, getSectionDomId, type SectionId } from './utils/sections';
import type {
  ProductPricing,
  ProductRecord,
  ProductWarranty,
  ProductWeightDetail,
} from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type UserRootState = Parameters<typeof selectUser>[0];

type ProductFormPricing = Omit<
  ProductPricing,
  'cost' | 'price' | 'listPrice' | 'avgPrice' | 'minPrice' | 'cardPrice' | 'offerPrice' | 'tax'
> & {
  cost?: number | string;
  price?: number | string;
  listPrice?: number | string;
  avgPrice?: number | string;
  minPrice?: number | string;
  cardPrice?: number | string;
  offerPrice?: number | string;
  tax?: number | string | null;
};

type ProductFormValues = Omit<ProductRecord, 'pricing'> & {
  pricing?: ProductFormPricing;
  weightDetail?: ProductWeightDetail;
  warranty?: ProductWarranty;
};

type UpdateProductStatus = false | 'create' | 'update';

interface UpdateProductState {
  status: UpdateProductStatus;
  product: ProductRecord;
}

interface UpdateProductRootState {
  updateProduct: UpdateProductState;
}

type FormErrorField = { errors?: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasBusinessId = (value: unknown): value is UserWithBusiness => {
  if (!isRecord(value)) return false;
  const businessId = value.businessID;
  return typeof businessId === 'string' && businessId.trim().length > 0;
};

const hasUserUid = (value: unknown): value is { uid: string } => {
  if (!isRecord(value)) return false;
  const uid = value.uid;
  return typeof uid === 'string' && uid.trim().length > 0;
};

const isFormValidationError = (
  value: unknown,
): value is { errorFields: FormErrorField[] } => {
  if (!value || typeof value !== 'object') return false;
  const errorFields = (value as { errorFields?: unknown }).errorFields;
  return Array.isArray(errorFields);
};

const toProductPreviewSnapshot = (
  source: ProductRecord | null | undefined,
): ProductSnapshot | null | undefined => {
  if (!source) return source;
  const pricing = source.pricing;
  const rawTax = pricing?.tax;
  const computedTax = Number(rawTax || 0);
  const normalizedTax: number | string = Number.isNaN(computedTax)
    ? 'NaN'
    : computedTax;

  return {
    pricing: pricing ? { ...pricing, tax: normalizedTax } : undefined,
    stock: source.stock,
    trackInventory: source.trackInventory,
    image: source.image,
    name: source.name,
    brand: source.brand,
    category: source.category,
    isVisible: source.isVisible,
  };
};

export default function ProductStudio() {
  const dispatch = useDispatch();
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(selectUser);
  const { product, status } = useSelector<UpdateProductRootState, UpdateProductState>(
    selectUpdateProductData,
  );
  const [form] = Form.useForm<ProductFormValues>();
  const { scrollContainerRef, activeSection, handleSectionNavigation } =
    useSectionNavigation();
  const normalizedProduct = useMemo<Partial<ProductFormValues>>(
    () => buildNormalizedProductSnapshot(product) || {},
    [product],
  );

  const { data: productBrands = [] } = useListenProductBrands();
  const { categories } = useFbGetCategories();
  const { data: activeIngredients = [] } = useListenActiveIngredients();
  const { configureAddProductCategoryModal } = useCategoryState();
  const navigate = useNavigate();
  const location = useLocation();
  const productIdFromParams = useMemo(
    () => new URLSearchParams(location.search).get('productId') || '',
    [location.search],
  );

  const [submitting, setSubmitting] = useState(false);
  const [imageDrawerVisible, setImageDrawerVisible] = useState(false);
  const [navigationVisible, setNavigationVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const lastLoadedProductIdRef = useRef<string | null>(null);
  const isUpdateMode = Boolean(productIdFromParams);

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
  const previewSnapshot = useMemo(
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
    async (
      rawId: string | null | undefined,
      { skipUrlUpdate = false, quiet = false }: { skipUrlUpdate?: boolean; quiet?: boolean } = {},
    ): Promise<boolean> => {
      const value = rawId?.trim();
      if (!value) {
        if (!quiet) {
          message.warning('Introduce un ID de producto válido.');
        }
        return false;
      }
      if (!hasBusinessId(user)) {
        message.error('No se pudo determinar el negocio activo.');
        return false;
      }
      try {
        const existingProduct = await fbGetProduct(user, value);
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
      } catch (error) {
        console.error('Error cargando producto:', error);
        message.error('No se pudo recuperar el producto.');
        return false;
      }
    },
    [dispatch, updateUrlProductId, user],
  );

  useEffect(() => {
    form.setFieldsValue(normalizedProduct);
  }, [normalizedProduct, form]);

  useEffect(() => {
    if (productIdFromParams) {
      if (productIdFromParams !== lastLoadedProductIdRef.current) {
        loadProductById(productIdFromParams, {
          skipUrlUpdate: true,
          quiet: true,
        });
      }
      return;
    }
    if (!productIdFromParams && lastLoadedProductIdRef.current) {
      resetToCreateState({ skipUrlUpdate: true });
    }
  }, [productIdFromParams, loadProductById, resetToCreateState]);

  const handleValuesChange = useCallback(
    (changedValues: Partial<ProductFormValues>) => {
      const [key] = Object.keys(changedValues) as Array<keyof ProductFormValues>;
      if (!key) {
        return;
      }
      const value = changedValues[key];

      if (key === 'pricing') {
        const normalizedPricing: ProductFormPricing = isRecord(value)
          ? { ...(value as ProductFormPricing) }
          : {};
        if (normalizedPricing?.tax !== undefined) {
          const t = normalizedPricing.tax;
          normalizedPricing.tax =
            typeof t === 'string' ? parseFloat(t) || 0 : Number(t);
        }
        if (normalizedPricing?.cost !== undefined) {
          normalizedPricing.cost =
            typeof normalizedPricing.cost === 'string'
              ? parseFloat(normalizedPricing.cost) || 0
              : Number(normalizedPricing.cost || 0);
        }
        dispatch(changeProductPrice({ pricing: normalizedPricing }));
        return;
      }

      if (key === 'weightDetail') {
        dispatch(
          ChangeProductData({
            product: {
              weightDetail: {
                ...(product?.weightDetail ?? {}),
                ...(isRecord(value) ? (value as ProductWeightDetail) : {}),
              },
            },
          }),
        );
        return;
      }

      if (key === 'warranty') {
        dispatch(
          ChangeProductData({
            product: {
              warranty: {
                ...(product?.warranty ?? {}),
                ...(isRecord(value) ? (value as ProductWarranty) : {}),
              },
            },
          }),
        );
        return;
      }

      if (key === 'itemType') {
        const normalizedItemType = normalizeItemType(value);
        const trackInventoryValue =
          normalizedItemType === 'service'
            ? false
            : normalizeTrackInventoryValue(
              product?.trackInventory,
              normalizedItemType,
            );

        dispatch(
          ChangeProductData({
            product: {
              itemType: normalizedItemType,
              trackInventory: trackInventoryValue,
            },
          }),
        );
        form.setFieldsValue({
          itemType: normalizedItemType,
          trackInventory: trackInventoryValue,
        });
        return;
      }

      if (key === 'brand') {
        const normalizedBrand =
          typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
        const sanitizedBrand = normalizedBrand || PRODUCT_BRAND_DEFAULT;
        dispatch(ChangeProductData({ product: { brand: sanitizedBrand } }));
        if (value !== sanitizedBrand) {
          form.setFieldsValue({ brand: sanitizedBrand });
        }
        return;
      }

      if (key === 'brandId') {
        const normalizedId = typeof value === 'string' ? value.trim() : null;
        let resolvedBrand = PRODUCT_BRAND_DEFAULT;

        if (normalizedId && normalizedId !== BRAND_DEFAULT_OPTION_VALUE) {
          if (normalizedId === BRAND_LEGACY_OPTION_VALUE && product?.brand) {
            resolvedBrand = product.brand;
          } else {
            const brandMatch = productBrands?.find(
              (brand) => brand?.id === normalizedId,
            );
            if (typeof brandMatch?.name === 'string') {
              resolvedBrand = brandMatch.name.trim();
            }
          }
        }

        dispatch(
          ChangeProductData({
            product: {
              brandId: normalizedId,
              brand: resolvedBrand || PRODUCT_BRAND_DEFAULT,
            },
          }),
        );

        if (!normalizedId || normalizedId === BRAND_DEFAULT_OPTION_VALUE) {
          form.setFieldsValue({ brandId: BRAND_DEFAULT_OPTION_VALUE });
        }
        return;
      }

      dispatch(ChangeProductData({ product: { ...changedValues } }));
    },
    [dispatch, form, product, productBrands],
  );

  const handleSubmit = async () => {
    if (!user) {
      message.error('No se encontró la sesión del usuario.');
      return;
    }
    if (!hasBusinessId(user)) {
      message.error('No se pudo determinar el negocio activo.');
      return;
    }

    setSubmitting(true);
    try {
      await form.validateFields();
      const sanitizedProduct = buildSanitizedProductForSubmit(product);
      if (!sanitizedProduct) {
        throw new Error('No hay datos de producto para guardar.');
      }

      if (isUpdateMode || status === 'update') {
        const productId =
          typeof sanitizedProduct.id === 'string' && sanitizedProduct.id.trim()
            ? sanitizedProduct.id
            : product?.id;
        if (!productId) {
          throw new Error(
            'El producto no tiene un identificador válido para actualizar.',
          );
        }
        const productForUpdate: ProductRecord & { id: string } = {
          ...sanitizedProduct,
          id: productId,
        };
        await fbUpdateProduct(productForUpdate, user);
        notification.success({
          message: 'Producto actualizado',
          description:
            'Los cambios están disponibles para el equipo en segundos.',
        });
      } else {
        if (!hasUserUid(user)) {
          throw new Error('No se pudo determinar el usuario activo.');
        }
        const productForCreate: ProductRecord & { stock: number } = {
          ...sanitizedProduct,
          stock:
            typeof sanitizedProduct.stock === 'number'
              ? sanitizedProduct.stock
              : Number(sanitizedProduct.stock ?? 0),
        };
        await fbAddProduct(productForCreate, user);
        notification.success({
          message: 'Producto creado',
          description:
            'El nuevo producto ya está disponible para ventas e inventario.',
        });
        resetToCreateState();
      }
    } catch (err: unknown) {
      if (isFormValidationError(err) && err.errorFields.length > 0) {
        err.errorFields.forEach((error) => {
          const fieldErrors = Array.isArray(error.errors) ? error.errors : [];
          notification.error({
            message: 'Revisa los campos del formulario',
            description:
              fieldErrors[0] || 'Hay valores pendientes por completar.',
            duration: 10,
          });
        });
        return;
      }
      console.error('Error guardando el producto:', err);
      const fallbackMessage =
        err instanceof Error ? err.message : 'Intenta nuevamente en unos segundos.';
      notification.error({
        message: 'No se pudo guardar',
        description: fallbackMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    resetToCreateState();
  };

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

  return (
    <PageContainer>
      <MenuApp
        sectionName={isUpdateMode ? 'Editando producto' : 'Creando producto'}
        toolbarProps={{
          isUpdateMode,
          navigationVisible,
          summaryVisible,
          onToggleNavigation: handleToggleNavigation,
          onToggleSummary: handleToggleSummary,
        }}
      />
      <Workspace $showNavigator={navigationVisible}>
        {navigationVisible && (
          <SectionNavigator
            activeSection={activeSection}
            onNavigate={handleSectionNavigation}
          />
        )}
        <ScrollArea ref={scrollContainerRef}>
          <StudioWrapper>
            <ActionBar
              isUpdateMode={isUpdateMode}
              submitting={submitting}
              onReset={handleReset}
              onSubmit={handleSubmit}
            />

            <ModeBanner isUpdateMode={isUpdateMode} />

            <StudioGrid $showSummary={summaryVisible}>
              <ProductForm
                form={form}
                onValuesChange={handleValuesChange}
                brandMeta={brandMeta}
                brandOptions={brandOptions}
                categories={categories}
                activeIngredients={activeIngredients}
                sectionDomIds={sectionDomIds}
                product={product}
                onOpenBrandModal={handleOpenBrandModal}
                onAddCategory={configureAddProductCategoryModal}
                onAddActiveIngredient={handleAddActiveIngredient}
                onOpenImageManager={() => setImageDrawerVisible(true)}
                onResetImage={handleResetImage}
              />

              {summaryVisible && (
                <StickySummary>
                  <ProductSummary
                    product={product}
                    previewMetrics={previewMetrics}
                  />
                </StickySummary>
              )}
            </StudioGrid>

            <ImageManager
              open={imageDrawerVisible}
              onCancel={() => setImageDrawerVisible(false)}
            />
          </StudioWrapper>
        </ScrollArea>
      </Workspace>
    </PageContainer>
  );
}



