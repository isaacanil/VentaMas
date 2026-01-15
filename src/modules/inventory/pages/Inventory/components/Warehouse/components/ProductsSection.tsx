import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, List } from 'antd';
import { Fragment } from 'react';
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
import type { InventoryStockItem, InventoryUser } from '@/utils/inventory/types';

type ProductsSectionProps = {
  location?: InventoryStockItem['location'] | null;
};

type ProductStockRecord =
  ReturnType<typeof useListenProductsStockByLocation>['data'][number];

export const ProductsSection = ({ location }: ProductsSectionProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as InventoryUser | null;
  const navigate = useNavigate();
  const { data: products } = useListenProductsStockByLocation(location as any);

  const handleDelete = async (product: ProductStockRecord | undefined) => {
    if (!product?.id) return;
    try {
      await deleteProductStock({ user: user as any, productStockId: product.id });
    } catch (error) {
      console.error('Failed to delete product stock', error);
    }
  };

  const onNavToProduct = (productId?: string | null) => {
    if (!productId) return;
    navigate(`/inventory/product/${productId}`);
  };

  return (
    <Fragment>
      <SectionContainer
        title="Productos"
        items={products}
        onAdd={() => dispatch(openProductStock({ location: location as any }))}
        renderItem={(product) => (
          <List.Item
            key={product.id || product.productId}
            actions={[
              <Button
                key="edit"
                icon={<FontAwesomeIcon icon={faEdit} />}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(openProductStock({ ...product, location: location as any }));
                }}
              />,
              <Button
                key="delete"
                icon={icons.editingActions.delete}
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product);
                }}
              />,
            ]}
            onClick={() => onNavToProduct(product.productId || undefined)}
          >
            <List.Item.Meta
              title={product.productName || ''}
              description={`Cantidad: ${product?.stock ?? 0}`}
            />
          </List.Item>
        )}
      />
    </Fragment>
  );
};
