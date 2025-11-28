import { Form, message, notification } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCategoryState } from '../../../../Context/CategoryContext';
import { openModal as openActiveIngredientModal } from '../../../../features/activeIngredients/activeIngredientsSlice';
import { selectUser } from '../../../../features/auth/userSlice';
import { openBrandModal } from '../../../../features/productBrands/productBrandSlice';
import {
  ChangeProductData,
  PRODUCT_BRAND_DEFAULT,
  changeProductPrice,
  clearUpdateProductData,
  selectUpdateProductData,
} from '../../../../features/updateProduct/updateProductSlice';
import { useFbGetCategories } from '../../../../firebase/categories/useFbGetCategories';
import { useListenActiveIngredients } from '../../../../firebase/products/activeIngredient/activeIngredients';
import { useListenProductBrands } from '../../../../firebase/products/brands/productBrands';
import { fbAddProduct } from '../../../../firebase/products/fbAddProduct';
import { fbGetProduct } from '../../../../firebase/products/fbGetProduct';
import { fbUpdateProduct } from '../../../../firebase/products/fbUpdateProduct';
import {
  BRAND_DEFAULT_OPTION_VALUE,
  BRAND_LEGACY_OPTION_VALUE,
} from '../../../component/modals/ProductForm/constants/brandOptions';
import ImageManager from '../../../component/modals/ProductForm/ImageManager/ImageManager';
import {
  buildNormalizedProductSnapshot,
  buildSanitizedProductForSubmit,
  normalizeItemType,
  normalizeTrackInventoryValue,
} from '../../../component/modals/ProductForm/utils/productNormalization';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';

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
import { useProductPreviewMetrics } from './hooks/useProductPreviewMetrics';
import { useSectionNavigation } from './hooks/useSectionNavigation';
import { brandFieldMetaByType, buildBrandOptions } from './utils/brandUtils';
import { FORM_SECTIONS, getSectionDomId } from './utils/sections';

export default function ProductStudio() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { product, status } = useSelector(selectUpdateProductData);
  const [form] = Form.useForm();
  const { scrollContainerRef, activeSection, handleSectionNavigation } =
    useSectionNavigation();
  const normalizedProduct = useMemo(
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
  const lastLoadedProductIdRef = useRef(null);
  const isUpdateMode = Boolean(productIdFromParams);

  const brandMeta = useMemo(
    () => brandFieldMetaByType(product?.type),
    [product?.type],
  );
  const brandOptions = useMemo(
    () => buildBrandOptions(productBrands, product),
    [productBrands, product],
  );
  const previewMetrics = useProductPreviewMetrics(product);
  const sectionDomIds = useMemo(
    () =>
      FORM_SECTIONS.reduce((acc, section) => {
        acc[section.id] = getSectionDomId(section.id);
        return acc;
      }, {}),
    [],
  );

  const updateUrlProductId = useCallback(
    (nextId) => {
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
    ({ skipUrlUpdate = false } = {}) => {
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
    async (rawId, { skipUrlUpdate = false, quiet = false } = {}) => {
      const value = rawId?.trim();
      if (!value) {
        if (!quiet) {
          message.warning('Introduce un ID de producto válido.');
        }
        return false;
      }
      if (!user?.businessID) {
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
    (changedValues) => {
      const key = Object.keys(changedValues)[0];
      const value = changedValues[key];

      if (key === 'pricing') {
        const normalizedPricing = { ...value };
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
            product: { weightDetail: { ...product?.weightDetail, ...value } },
          }),
        );
        return;
      }

      if (key === 'warranty') {
        dispatch(
          ChangeProductData({
            product: { warranty: { ...product?.warranty, ...value } },
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
            if (brandMatch?.name) {
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

    setSubmitting(true);
    try {
      await form.validateFields();
      const sanitizedProduct = buildSanitizedProductForSubmit(product);
      if (!sanitizedProduct) {
        throw new Error('No hay datos de producto para guardar.');
      }

      if (isUpdateMode || status === 'update') {
        if (!product?.id) {
          throw new Error(
            'El producto no tiene un identificador válido para actualizar.',
          );
        }
        await fbUpdateProduct(sanitizedProduct, user);
        notification.success({
          message: 'Producto actualizado',
          description:
            'Los cambios están disponibles para el equipo en segundos.',
        });
      } else {
        await fbAddProduct(sanitizedProduct, user);
        notification.success({
          message: 'Producto creado',
          description:
            'El nuevo producto ya está disponible para ventas e inventario.',
        });
        resetToCreateState();
      }
    } catch (err) {
      if (err?.errorFields?.length) {
        err.errorFields.forEach((error) => {
          notification.error({
            message: 'Revisa los campos del formulario',
            description:
              error.errors?.[0] || 'Hay valores pendientes por completar.',
            duration: 10,
          });
        });
        return;
      }
      console.error('Error guardando el producto:', err);
      notification.error({
        message: 'No se pudo guardar',
        description: err?.message || 'Intenta nuevamente en unos segundos.',
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
