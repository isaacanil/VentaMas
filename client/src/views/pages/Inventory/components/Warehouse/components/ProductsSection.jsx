import React, { Fragment } from 'react'
import SectionContainer from './SectionContainer'
import { Button, List } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { openProductStock } from '../../../../../../features/productStock/productStockSlice';
import { useDispatch, useSelector } from 'react-redux';
import { icons } from '../../../../../../constants/icons/icons';
import { deleteProductStock, useListenProductsStockByLocation } from '../../../../../../firebase/warehouse/ProductStockService';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useNavigate } from 'react-router-dom';

export const ProductsSection = ({ location }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const { data: products, loading, error } = useListenProductsStockByLocation(location);

    const handleDelete = async (product) => {
        if (!product) return;
        console.log(product)
        try {
            await deleteProductStock(user, product.id)
        } catch (error) {

        }
    }

    const onNavToProduct = (productId) => {
        navigate(`/inventory/product/${productId}`)
    }

    return (
        <Fragment>
            <SectionContainer
                title="Productos"
                items={products}
                onAdd={() => dispatch(openProductStock({ location }))}
                renderItem={(product) => (
                    <List.Item
                        actions={[
                            <Button
                                icon={<FontAwesomeIcon icon={faEdit} />}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(openProductStock({ ...product, location }))
                                }}
                            >
                            </Button>,
                            <Button
                                icon={icons.editingActions.delete}
                                danger
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(product)
                                }}
                            >
                            </Button>,
                        ]}
                        onClick={() => onNavToProduct(product.productId)}
                    >
                        <List.Item.Meta
                            title={product.productName}
                            description={`Cantidad: ${product?.stock}`}
                        />
                    </List.Item>
                )}
            />
        </Fragment>
    )
}
