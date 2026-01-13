
import { Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { closeModalUpdateProd } from '@/features/modals/modalSlice';
import {
  clearUpdateProductData,
  selectUpdateProductData,
  setProduct,
} from '@/features/updateProduct/updateProductSlice';
import { listenToProduct } from '@/firebase/products/fbListenProduct';
import type { ProductRecord } from '@/types/products';

import ImageManager from './ImageManager/ImageManager';
import { ProductForm } from './ProductForm';

type ProductEditorModalProps = {
  isOpen: boolean;
};

type ProductEditorView = 'product-form' | 'image-manager';

export const ProductEditorModal = ({ isOpen }: ProductEditorModalProps) => {
  const [view, setView] = useState<ProductEditorView>('product-form');
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { product, status } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
    status: string | false;
  };

  const showImageManager = () => setView('image-manager');
  const hideImageManager = () => setView('product-form');
  const handleCloseModal = () => {
    dispatch(closeModalUpdateProd());
    dispatch(clearUpdateProductData());
  };
  useEffect(() => {
    if (!user || !product?.id) return;
    const handleData = (data: ProductRecord) => dispatch(setProduct(data));
    const handleError = (error: unknown) =>
      console.error('Error al escuchar el producto:', error);

    const unsubscribe = listenToProduct(
      user,
      product.id,
      handleData,
      handleError,
    );
    return () => unsubscribe && unsubscribe();
  }, [user, product?.id, dispatch]);

  return (
    <Modal
      centered={true}
      open={isOpen}
      width={1200}
      style={{ top: 5 }}
      title={status === 'update' ? `Editar: ${product.name}` : 'Nuevo Producto'}
      onCancel={handleCloseModal}
      footer={null}
    >
      <ProductForm showImageManager={showImageManager} />
      <ImageManager
        open={view === 'image-manager'}
        onCancel={hideImageManager}
      />
    </Modal>
  );
};
