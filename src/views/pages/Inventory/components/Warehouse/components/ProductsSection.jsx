import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, List } from 'antd';
import React, { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import { openProductStock } from '@/features/productStock/productStockSlice';
import {
  deleteProductStock,
  useListenProductsStockByLocation,
} from '@/firebase/warehouse/productStockService';

import SectionContainer from './SectionContainer';

export const ProductsSection = ({ location }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const { data: products } = useListenProductsStockByLocation(location);

  const handleDelete = async (product) => {
    if (!product) return;
    try {
      await deleteProductStock(user, product.id);
    } catch (error) {
      console.error('Failed to delete product stock', error);
    }
  };

  const onNavToProduct = (productId) => {
    navigate(`/inventory/product/${productId}`);
  };

  return (
    <Fragment>
      <SectionContainer
        title="Productos"
        items={products}
        onAdd={() => dispatch(openProductStock({ location }))}
        renderItem={(product) => (
          <List.Item
            key={product.id}
            actions={[
              <Button
                key="edit"
                icon={<FontAwesomeIcon icon={faEdit} />}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(openProductStock({ ...product, location }));
                }}
              ></Button>,
              <Button
                key="delete"
                icon={icons.editingActions.delete}
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product);
                }}
              ></Button>,
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
  );
};
