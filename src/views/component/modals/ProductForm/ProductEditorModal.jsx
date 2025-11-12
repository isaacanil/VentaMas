import { Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../../../features/auth/userSlice';
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice';
import {
  clearUpdateProductData,
  selectUpdateProductData,
  setProduct,
} from '../../../../features/updateProduct/updateProductSlice';
import { listenToProduct } from '../../../../firebase/products/fbListenProduct';

import ImageManager from './ImageManager/ImageManager';
import { ProductForm } from './ProductForm';

export const ProductEditorModal = ({ isOpen }) => {
  const [view, setView] = useState('product-form');
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { product, status } = useSelector(selectUpdateProductData);

  const showImageManager = () => setView('image-manager');
  const hideImageManager = () => setView('product-form');
  const handleCloseModal = () => {
    dispatch(closeModalUpdateProd());
    dispatch(clearUpdateProductData());
  };
  useEffect(() => {
    if (!user || !product?.id) return;
    const handleData = (data) => dispatch(setProduct(data));
    const handleError = (error) =>
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
      {view === 'product-form' && (
        <ProductForm showImageManager={showImageManager} />
      )}
      {view === 'image-manager' && (
        <ImageManager hideImageManager={hideImageManager} />
      )}
    </Modal>
  );
};
