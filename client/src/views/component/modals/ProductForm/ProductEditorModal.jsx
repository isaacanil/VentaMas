import React, { useEffect, useState } from 'react'
import { Modal } from 'antd';
import { ProductForm } from './ProductForm';
import ImageManager from './ImageManager/ImageManager';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice';
import { clearUpdateProductData, selectUpdateProductData, setProduct } from '../../../../features/updateProduct/updateProductSlice';
import { listenToProduct } from '../../../../firebase/products/fbListenProduct';
import { selectUser } from '../../../../features/auth/userSlice';

// Definir las columnas de la tabla

export const ProductEditorModal = ({ isOpen }) => {
    const [view, setView] = useState('product-form')
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const { product, status } = useSelector(selectUpdateProductData)

    const showImageManager = () => setView('image-manager');
    const hideImageManager = () => setView('product-form');
    const handleCloseModal = () => {
        dispatch(closeModalUpdateProd())
        dispatch(clearUpdateProductData())
    }
    useEffect(() => {
        if(product.id === '') return;
        const handleData = (data) => dispatch(setProduct(data))
        
        const handleError = (error) => console.error('Error al escuchar el producto:', error);

        const unsubscribe = listenToProduct(user, product.id, handleData, handleError);

        return () => unsubscribe();
    }, [user])
    return (
        <Modal
            centered={true}
            open={isOpen}
            width={1000}
            style={{ top: 5 }}
            title={status === "update" ? `Editar ${product.name} ${product.id}` : "Nuevo Producto"}
            onCancel={handleCloseModal}
            footer={null}
        >
            {view === "product-form" && <ProductForm showImageManager={showImageManager} />}
            {view === "image-manager" && <ImageManager hideImageManager={hideImageManager} />}

        </Modal>
    )
}
