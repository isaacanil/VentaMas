import React, { useEffect, useState } from 'react'
import * as ant from 'antd';
const { Form, Input, Select, Button, Radio, InputNumber, Card, Upload, Modal, Space, Row, Col, Image, Divider, Flex, Affix, Checkbox, Anchor } = ant;

import { ProductForm } from './ProductForm';
import ImageManager from './ImageManager/ImageManager';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalUpdateProd } from '../../../../features/modals/modalSlice';
import { clearUpdateProductData, selectUpdateProductData } from '../../../../features/updateProduct/updateProductSlice';

// Definir las columnas de la tabla

export const ProductEditorModal = ({isOpen}) => {
    const [view, setView] = useState('product-form')
    const dispatch = useDispatch();
    const { product, status } = useSelector(selectUpdateProductData)
    const hideModal = () => {
        console.log('hola')
    }
    const showImageManager = () => setView('image-manager');
    const hideImageManager = () => setView('product-form');
    const handleCloseModal = () => {
        dispatch(closeModalUpdateProd())
        dispatch(clearUpdateProductData())
    }
    return (
        <Modal
            centered={true}
            open={isOpen}
            width={'1000px'}
            styles={{
                maxHeight: 300,
                overflow: "auto",
                padding: "0",
                margin: "0"
            }}
            title={status === "update" ? `Editar ${product.productName}` : "Nuevo Producto"}
            onCancel={handleCloseModal}
            onOk={hideModal}
            footer={null}
            // footer={[
            //     <Button key="back" onClick={hideModal}>
            //         Return
            //     </Button>,
            //     <Button key="submit" type="primary" onClick={hideModal}>
            //         Submit
            //     </Button>,
            // ]}

        >
          
            {view === "product-form" && <ProductForm showImageManager={showImageManager} />}
            {view === "image-manager" && <ImageManager hideImageManager={hideImageManager}/>}

        </Modal>
    )
}
