import React, { useState, useEffect, CSSProperties } from 'react';
import { Button, Typography, Alert, Space, Tag, Collapse, Empty, Spin } from 'antd';
import styled from 'styled-components';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../../firebase/firebaseconfig';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { List as VirtualizedList } from 'react-virtualized';
import AutoSizer from 'react-virtualized-auto-sizer';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const Container = styled.div`
  padding: 20px;
`;

const ProductGroup = styled.div`
  margin-bottom: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const GroupName = styled(Text)`
  font-weight: bold;
  font-size: 16px;
`;

const ProductList = styled.div`
  padding: 0;
`;

const ProductItem = styled.div<{ hasBarcodeIssue?: boolean }>`
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: ${props => props.hasBarcodeIssue ? '#fff9f0' : 'white'};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${props => props.hasBarcodeIssue ? '#ffefdb' : '#f5f5f5'};
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProductActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BarcodeWarning = styled.div`
  margin-left: 8px;
  color: #fa8c16;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StyledPanel = styled(Panel)`
  .ant-collapse-header {
    font-weight: bold;
  }
  
  .ant-collapse-content-box {
    padding: 0 !important;
  }
`;

const NoBarcode = styled(Tag)`
  background-color: #fff2e8;
  color: #fa541c;
  border-color: #ffbb96;
`;

const HasBarcode = styled(Tag)`
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #91d5ff;
`;

const VirtualizedProductList = styled.div`
  height: 300px;
  width: 100%;
`;

const ProductListItem = styled.div<{ hasBarcodeIssue?: boolean; isAlternate?: boolean }>`
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: ${props => {
    if (props.hasBarcodeIssue) return '#fff9f0';
    if (props.isAlternate) return '#fafafa';
    return 'white';
  }};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${props => props.hasBarcodeIssue ? '#ffefdb' : '#f5f5f5'};
  }
`;

interface ProductPricing {
  avgPrice: number;
  cost: number;
  listPrice: number;
  minPrice: number;
  price: number;
  tax: string;
}

interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode: string;
  category: string;
  stock: number;
  pricing: ProductPricing;
  status: string;
  updatedAt: string;
  type: string;
  isVisible: boolean;
}

interface GroupedProduct {
  name: string;
  products: Product[];
  hasBarcodeIssue: boolean;
}

export const DuplicateProducts: React.FC = () => {
  const [productGroups, setProductGroups] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useSelector(selectUser);
  const businessID = user?.businessID;

  useEffect(() => {
    if (businessID) {
      loadDuplicateProducts();
    }
  }, [businessID]);

  const loadDuplicateProducts = async () => {
    try {
      const productsRef = collection(db, 'businesses', businessID, 'products');
      const querySnapshot = await getDocs(productsRef);

      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        const product = doc.data() as Product;
        product.id = doc.id;
        products.push(product);
      });

      // Agrupar productos por nombre
      const groupsByName = products.reduce((acc, product) => {
        if (!product.name) return acc;
        
        const key = product.name.toLowerCase().trim();
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(product);
        return acc;
      }, {} as Record<string, Product[]>);

      // Crear grupos finales y detectar problemas con códigos de barras
      let groups: GroupedProduct[] = Object.entries(groupsByName)
        .filter(([_, products]) => products.length > 1) // Solo grupos con más de un producto
        .map(([name, products]) => {
          // Ordenar los productos dentro del grupo alfabéticamente por nombre primero
          // y luego por otros criterios si los nombres son iguales
          const sortedProducts = [...products].sort((a, b) => {
            // Si los nombres son iguales, ordenar por código de barras
            if (a.name.toLowerCase() === b.name.toLowerCase()) {
              // Productos con código de barras primero
              if (a.barcode && !b.barcode) return -1;
              if (!a.barcode && b.barcode) return 1;
              // Si ambos tienen o no tienen código de barras, ordenar por el código
              return (a.barcode || '').localeCompare(b.barcode || '');
            }
            // Ordenar por nombre
            return a.name.localeCompare(b.name);
          });

          // Detectar si en el grupo hay productos con y sin código de barras
          const withBarcode = sortedProducts.filter(p => p.barcode && p.barcode.trim().length > 0);
          const withoutBarcode = sortedProducts.filter(p => !p.barcode || p.barcode.trim().length === 0);
          
          const hasBarcodeIssue = withBarcode.length > 0 && withoutBarcode.length > 0;
          
          return {
            name: sortedProducts[0].name,
            products: sortedProducts,
            hasBarcodeIssue
          };
        });

      // Ordenar los grupos alfabéticamente por nombre
      groups = groups.sort((a, b) => a.name.localeCompare(b.name));

      setProductGroups(groups);
      setLoading(false);
    } catch (err) {
      console.error("Error loading duplicate products:", err);
      setError('Error al cargar productos duplicados');
      setLoading(false);
    }
  };
  const handleMergeProducts = async (productId: string) => {
    try {
      // Implementación pendiente de la funcionalidad de fusión
      await loadDuplicateProducts();
    } catch (err) {
      setError('Error al fusionar productos');
    }
  };

  // Componente para renderizar un elemento de la lista virtualizada
  const ProductRow = ({ index, style, data }: { index: number; style: CSSProperties; data: Product[] }) => {
    const product = data[index];
    const hasBarcode = product.barcode && product.barcode.trim().length > 0;
    const hasBarcodeIssue = data.some(p => p.barcode && p.barcode.trim().length > 0) && 
                           data.some(p => !p.barcode || p.barcode.trim().length === 0);
    
    return (
      <ProductListItem 
        style={style} 
        hasBarcodeIssue={hasBarcodeIssue && !hasBarcode}
        isAlternate={index % 2 === 1}
      >
        <ProductInfo>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text strong>{product.name}</Text>
            {hasBarcodeIssue && (
              hasBarcode ? 
                <HasBarcode>Con código: {product.barcode}</HasBarcode> : 
                <NoBarcode><WarningOutlined /> Sin código de barras</NoBarcode>
            )}
          </div>
          <Space size="small">
            <Text type="secondary">Categoría: {product.category || 'N/A'}</Text>
            <Text type="secondary">Precio: ${product.pricing?.price || 0}</Text>
            <Text type="secondary">Stock: {product.stock || 0}</Text>
            <Tag color={product.isVisible ? 'green' : 'red'}>
              {product.isVisible ? 'Activo' : 'Inactivo'}
            </Tag>
          </Space>
        </ProductInfo>
        <ProductActions>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => handleMergeProducts(product.id)}
          >
            Fusionar
          </Button>
        </ProductActions>
      </ProductListItem>
    );
  };

  if (error) return <Alert message={error} type="error" />;

  return (
    <Container>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>Productos Duplicados</Title>
        <Alert 
          message="Productos con nombres duplicados" 
          description="Se muestra especial atención a productos que tienen el mismo nombre pero inconsistencias en sus códigos de barras."
          type="warning" 
          showIcon 
        />
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" tip="Cargando productos duplicados..." />
          </div>
        ) : productGroups.length === 0 ? (
          <Empty description="No se encontraron productos duplicados" />
        ) : (
          <Collapse defaultActiveKey={productGroups.map((_, index) => String(index))} ghost>
            {productGroups.map((group, groupIndex) => (
              <StyledPanel 
                key={groupIndex} 
                header={
                  <GroupHeader>
                    <GroupName>
                      {group.name}
                      {group.hasBarcodeIssue && (
                        <BarcodeWarning>
                          <ExclamationCircleOutlined />
                          <span>Inconsistencia en códigos de barras</span>
                        </BarcodeWarning>
                      )}
                    </GroupName>
                    <Text type="secondary">{group.products.length} productos</Text>
                  </GroupHeader>
                }
              >
                <VirtualizedProductList>
                  <div style={{ height: '300px', overflowY: 'auto' }}>
                    {group.products.map((product, index) => {
                      const hasBarcode = product.barcode && product.barcode.trim().length > 0;
                      const hasBarcodeIssue = group.hasBarcodeIssue;
                      
                      return (
                        <ProductListItem 
                          key={product.id}
                          hasBarcodeIssue={hasBarcodeIssue && !hasBarcode}
                          isAlternate={index % 2 === 1}
                        >
                          <ProductInfo>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Text strong>{product.name}</Text>
                              {hasBarcodeIssue && (
                                hasBarcode ? 
                                  <HasBarcode>Con código: {product.barcode}</HasBarcode> : 
                                  <NoBarcode><WarningOutlined /> Sin código de barras</NoBarcode>
                              )}
                            </div>
                            <Space size="small">
                              <Text type="secondary">Categoría: {product.category || 'N/A'}</Text>
                              <Text type="secondary">Precio: ${product.pricing?.price || 0}</Text>
                              <Text type="secondary">Stock: {product.stock || 0}</Text>
                              <Tag color={product.isVisible ? 'green' : 'red'}>
                                {product.isVisible ? 'Activo' : 'Inactivo'}
                              </Tag>
                            </Space>
                          </ProductInfo>
                          <ProductActions>
                            <Button 
                              type="primary" 
                              size="small" 
                              onClick={() => handleMergeProducts(product.id)}
                            >
                              Fusionar
                            </Button>
                          </ProductActions>
                        </ProductListItem>
                      );
                    })}
                  </div>
                </VirtualizedProductList>
              </StyledPanel>
            ))}
          </Collapse>
        )}
      </Space>
    </Container>
  );
};
