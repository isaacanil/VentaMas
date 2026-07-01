import { LoadingOutlined } from '@/constants/icons/antd';
import { Form, notification } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { closeModalUpdateProd } from '@/features/modals/modalSlice';
import {
  ChangeProductData,
  changeProductPrice,
  clearUpdateProductData,
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';
import { useListenProductBrands } from '@/firebase/products/brands/productBrands';
import { fbAddProduct } from '@/firebase/products/fbAddProduct';
import { fbUpdateProduct } from '@/firebase/products/fbUpdateProduct';
import {
  BRAND_DEFAULT_OPTION_VALUE,
  normalizeProductBrandName,
  resolveBrandSelection,
} from '@/domain/products/brandSelection';
import {
  buildNormalizedProductSnapshot,
  buildSanitizedProductForSubmit,
  normalizeItemType,
  normalizeTrackInventoryValue,
} from '@/domain/products/normalization';
import { normalizeChangedProductPricingPatch } from '@/domain/products/pricingForm';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';
import { normalizeSaleUnitsChangeForModal } from './useGeneralProductForm.helpers';

interface ValidationError {
  errorFields?: Array<{ errors?: string[] }>;
  message?: string;
}

export const useGeneralProductForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [submit, setSubmit] = useState(false);
  const [form] = Form.useForm();
  const { product, status } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
    status: string | false;
  };
  const { data: productBrands = [] } = useListenProductBrands();

  const userWithBusiness = user?.businessID ? (user as UserWithBusiness) : null;
  const userWithUid =
    user?.businessID && user?.uid
      ? (user as UserWithBusiness & { uid: string })
      : null;

  const productFormSyncKey = `${status ?? 'unknown'}:${product?.id || 'new'}`;
  const lastSyncedProductKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastSyncedProductKeyRef.current === productFormSyncKey) return;
    const normalizedForForm = buildNormalizedProductSnapshot(product);
    if (!normalizedForForm) return;

    lastSyncedProductKeyRef.current = productFormSyncKey;
    form.setFieldsValue(normalizedForForm);
  }, [form, product, productFormSyncKey]);

  const handleChangeValues = (
    changeValue: Partial<ProductRecord>,
    allValues?: Partial<ProductRecord>,
  ) => {
    const key = Object.keys(changeValue)[0];
    const value = changeValue[key];

    if (key === 'pricing') {
      const normalizedPricing = normalizeChangedProductPricingPatch(value);
      dispatch(changeProductPrice({ pricing: normalizedPricing }));
      return;
    }

    if (key === 'weightDetail') {
      dispatch(
        ChangeProductData({
          product: {
            weightDetail: {
              ...product?.weightDetail,
              ...changeValue?.weightDetail,
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
            warranty: { ...product?.warranty, ...changeValue?.warranty },
          },
        }),
      );
      return;
    }

    if (key === 'saleUnits') {
      dispatch(
        ChangeProductData({
          product: {
            saleUnits: normalizeSaleUnitsChangeForModal(
              changeValue,
              allValues,
            ),
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
      const sanitizedBrand = normalizeProductBrandName(value);
      dispatch(ChangeProductData({ product: { brand: sanitizedBrand } }));
      if (value !== sanitizedBrand) {
        form.setFieldsValue({ brand: sanitizedBrand });
      }
      return;
    }

    if (key === 'brandId') {
      const resolvedBrandSelection = resolveBrandSelection({
        value,
        product,
        productBrands,
      });

      dispatch(
        ChangeProductData({
          product: resolvedBrandSelection,
        }),
      );

      const normalizedId = resolvedBrandSelection.brandId;
      if (!normalizedId || normalizedId === BRAND_DEFAULT_OPTION_VALUE) {
        form.setFieldsValue({ brandId: BRAND_DEFAULT_OPTION_VALUE });
      }
      return;
    }

    dispatch(ChangeProductData({ product: { ...changeValue } }));
  };

  const onFinish = async (_values: ProductRecord) => {
    setSubmit(true);
    const isUpdatingProduct = status === 'update';
    const sanitizedProduct = buildSanitizedProductForSubmit(product);

    if (isUpdatingProduct) {
      if (!userWithBusiness) {
        notification.error({
          message: 'No se pudo completar la operacion',
          description: 'No se encontro un negocio valido para actualizar.',
          duration: 10,
        });
        setSubmit(false);
        return;
      }
      if (!product?.id) {
        notification.error({
          message: 'No se pudo completar la operacion',
          description:
            'El producto no tiene un identificador valido para actualizar.',
          duration: 10,
        });
        setSubmit(false);
        return;
      }
      if (!sanitizedProduct?.id) {
        notification.error({
          message: 'No se pudo completar la operacion',
          description: 'No hay datos de producto para guardar.',
          duration: 10,
        });
        setSubmit(false);
        return;
      }
    } else {
      if (!sanitizedProduct) {
        notification.error({
          message: 'No se pudo completar la operacion',
          description: 'No hay datos de producto para guardar.',
          duration: 10,
        });
        setSubmit(false);
        return;
      }
      if (!userWithUid) {
        notification.error({
          message: 'No se pudo completar la operacion',
          description: 'No se encontro un usuario valido para crear.',
          duration: 10,
        });
        setSubmit(false);
        return;
      }
    }

    const saveProduct = isUpdatingProduct
      ? () =>
          fbUpdateProduct(
            { ...sanitizedProduct, id: String(sanitizedProduct.id) },
            userWithBusiness,
          )
      : () => {
          const stockValue =
            typeof sanitizedProduct.stock === 'number'
              ? sanitizedProduct.stock
              : Number(sanitizedProduct.stock ?? 0) || 0;
          return fbAddProduct(
            { ...sanitizedProduct, stock: stockValue },
            userWithUid,
          );
        };
    const successNotification = isUpdatingProduct
      ? {
          message: 'Producto Actualizado',
          description: 'El producto ha sido actualizado correctamente.',
        }
      : {
          message: 'Producto Creado',
          description: 'El producto ha sido creado correctamente.',
        };

    try {
      await saveProduct();
      notification.success(successNotification);
      dispatch(closeModalUpdateProd());
      dispatch(clearUpdateProductData());
    } catch (error) {
      const validationError = error as ValidationError;

      if (validationError?.errorFields?.length) {
        validationError.errorFields.forEach((item) => {
          notification.error({
            message: 'Error',
            description: item.errors?.[0] || 'Revisa los valores ingresados.',
            duration: 10,
          });
        });
      } else {
        console.error('Error al guardar el producto:', error);
        notification.error({
          message: 'No se pudo completar la operacion',
          description:
            (error as Error)?.message || 'Intenta de nuevo mas tarde.',
          duration: 10,
        });
      }
    }

    setSubmit(false);
  };

  const handleReset = () => {
    form.resetFields();
    dispatch(closeModalUpdateProd());
    dispatch(clearUpdateProductData());
  };

  const handleFormKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' && event.key !== 'NumpadEnter') return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    const tagName = target.tagName;
    const isTextArea = tagName === 'TEXTAREA';
    const isSubmitButton =
      tagName === 'BUTTON' &&
      (target as HTMLButtonElement).type?.toLowerCase() === 'submit';
    const allowEnter = target.getAttribute('data-allow-enter') === 'true';

    if (isTextArea || isSubmitButton || allowEnter) return;

    event.preventDefault();
    event.stopPropagation();
  };

  const submitLabel = status === 'update' ? 'Actualizar' : 'Crear';
  const spinnerIndicator = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  return {
    form,
    handleChangeValues,
    handleFormKeyDown,
    handleReset,
    onFinish,
    product,
    productBrands,
    spinnerIndicator,
    status,
    submit,
    submitLabel,
  };
};
