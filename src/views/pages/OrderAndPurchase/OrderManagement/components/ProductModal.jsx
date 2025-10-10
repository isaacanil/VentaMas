import { faImage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Input, message, Pagination } from 'antd';
import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

import { useGetProducts } from '../../../../../firebase/products/fbGetProducts';
import { filterData } from '../../../../../hooks/search/useSearch';

export const Header = styled.div`
 padding: 0 1em;
`;

export const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
   align-items: start;
   overflow-y: auto;
   padding: 0 1em;
   align-content: start;
  gap: 12px;
`;

export const ProductCard = styled.div`
  background-color: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const ImageContainer = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  background-color: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;

  img, .placeholder-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d9d9d9;
    font-size: 20px;
  }
`;

export const ProductInfo = styled.div`
  flex: 1;
  min-width: 0; // Importante para que el text-overflow funcione

  .name {
    font-size: 13px;
    font-weight: 500;
    color: #262626;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .barcode {
    font-size: 11px;
    color: #8c8c8c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Wrapper = styled.div`
 
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 8px;
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ProductModal = ({ onSelect, selectedProduct }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(14);

  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [visible]);

  const { products, loading } = useGetProducts(true);
  const filteredProducts = search ? filterData(products, search) : products;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = currentPage * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  function selectProduct(product) {
    onSelect(product);
    setSearch('');
    setCurrentPage(1);
    setVisible(false);
    message.success('Product selected');
  }
  function onSearchChange(e) {
    setSearch(e.target.value);
    setCurrentPage(1);
  }


  return (
    <div>
      <Input
        value={selectedProduct?.name || ''}
        placeholder="Search and select a product..."
        readOnly

        onClick={() => setVisible(true)}
      />
      <Drawer
        title="Lista de Productos"
        placement="bottom"
        onClose={() => setVisible(false)}
        open={visible}
        loading={loading}
        height={'80%'}
        styles={{
          body: { padding: '1em' },
        }}
        width={1000}
      >
        <Wrapper>
          <Header>
            <Input
              ref={searchInputRef}
              placeholder="Buscar productos..."
              value={search}
              onChange={onSearchChange}
              style={{ width: '100%' }}
            />
          </Header>

          <ProductsContainer>
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} onClick={() => selectProduct(product)}>
                <ImageContainer>
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="placeholder-icon">
                      <FontAwesomeIcon icon={faImage} />
                    </div>
                  )}
                </ImageContainer>
                <ProductInfo>
                  <div className="name">{product?.name}</div>
                  <div className="barcode">{product?.barcode}</div>
                </ProductInfo>
              </ProductCard>
            ))}
          </ProductsContainer>

          <PaginationContainer>
            <Pagination
              current={currentPage}
              showSizeChanger={false}
              hideOnSinglePage
              simple={{readOnly: true}}
              total={filteredProducts.length}
              onChange={(page) => setCurrentPage(page)}
            />
          </PaginationContainer>
        </Wrapper>
      </Drawer>
    </div>
  );
};

export default ProductModal;
