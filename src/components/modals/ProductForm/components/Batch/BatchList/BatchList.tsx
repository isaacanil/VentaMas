'use client';

import { List, Tag } from 'antd';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import { listenAllBatches } from '@/firebase/warehouse/batchService';
import type { Batch } from '@/models/Warehouse/Batch';
import type { ProductRecord } from '@/types/products';
import type { InventoryUser } from '@/utils/inventory/types';

// Styled Components
const StyledContainer = styled.div`
  min-height: 100vh;
`;
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const StyledTitle = styled.h2`
  margin-bottom: 24px;
  font-size: 1.2rem;
  font-weight: 700;
`;

type BatchListItem = Partial<Batch> & {
  key?: React.Key;
  numberId?: string | number | null;
  quantity?: number | null;
  expirationDate?: string | null;
} & Record<string, unknown>;

const BatchList = () => {
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord | null;
  };
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const user = useSelector(selectUser) as InventoryUser | null;

  useEffect(() => {
    if (!user || !product?.id) return;

    const unsubscribe = listenAllBatches(user, product?.id, setBatches);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, product]);

  return (
    <StyledContainer>
      {/* <Form.Item
        label="Producto con lotes"
        valuePropName="checked"
      >
        <Switch
          checked={product.hasBatch}
          onChange={handleBatchSwitch}
          style={{ marginRight: 8 }}
        />
      </Form.Item> */}

      {/* {product.hasBatch && ( */}
      <div>
        <Header>
          <StyledTitle>Lista de Lotes</StyledTitle>
        </Header>
        <List
          dataSource={batches}
          renderItem={(item) => (
            <List.Item key={item.key}>
              <List.Item.Meta
                title={<strong>Lote #{item.numberId}</strong>}
                description={
                  <>
                    <div>
                      Cantidad: <Tag color="blue">{item.quantity}</Tag>
                    </div>
                    <div>
                      Fecha de Expiración:{' '}
                      {DateTime.fromISO(
                        item.expirationDate ?? '',
                      ).toLocaleString(DateTime.DATE_MED)}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </div>
      {/* )} */}
    </StyledContainer>
  );
};

export default BatchList;
