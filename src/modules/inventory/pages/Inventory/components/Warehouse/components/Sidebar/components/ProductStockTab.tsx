import { SearchOutlined } from '@/constants/icons/antd';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { Input, Empty, Spin } from 'antd';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Tree from '@/modules/inventory/components/tree/Tree';
import type {
  TreeConfig,
  TreeNodeData,
} from '@/modules/inventory/components/tree/Tree';

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 16px;
`;

const ProductList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

type ProductSummary = {
  id: string;
  name?: string;
  barcode?: string | number | null;
} & Record<string, unknown>;

type ProductStockTabProps = {
  products: ProductSummary[];
  loading?: boolean;
  onSearch: (value: string) => void;
};

const ProductStockTab = ({
  products,
  loading = false,
  onSearch,
}: ProductStockTabProps) => {
  const navigate = useNavigate();

  const productTreeConfig: TreeConfig<TreeNodeData> = {
    actions: [
      {
        name: 'Ver Stock',
        icon: faEye,
        type: 'button',
        handler: (node) => {
          navigate(`/inventory/warehouses/product/${String(node.id)}/stock`);
        },
      },
    ],
    onNodeClick: (node) => {
      navigate(`/inventory/warehouses/product/${String(node.id)}/stock`);
    },
    showMatchedStockCount: false,
    showActions: true,
    searchPlaceholder: 'Buscar productos en stock...',
  };

  const treeData = useMemo<TreeNodeData[]>(
    () =>
      products.map((product) => ({
        id: product.id,
        name: product.name || 'Sin nombre',
        extraDetails: product.barcode
          ? [{ text: `#${product.barcode}`, type: 'default' }]
          : [],
        data: product,
      })),
    [products],
  );

  return (
    <TabContent>
      <Input
        placeholder="Buscar productos..."
        prefix={<SearchOutlined />}
        onChange={(e) => onSearch(e.target.value)}
      />
      <ProductList>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Empty description="No se encontraron productos" />
          </div>
        ) : (
          <Tree data={treeData} config={productTreeConfig} />
        )}
      </ProductList>
    </TabContent>
  );
};

export default ProductStockTab;
