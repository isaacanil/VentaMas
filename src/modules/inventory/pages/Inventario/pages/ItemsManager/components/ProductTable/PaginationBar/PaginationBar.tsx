import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/ui/Button/Button';
import type { ProductRecord } from '@/types/products';

type PaginationBarProps = {
  products: ProductRecord[];
  setFilteredProducts: React.Dispatch<React.SetStateAction<ProductRecord[]>>;
  productsPerPage: number;
};

export const PaginationBar = ({
  products,
  setFilteredProducts,
  productsPerPage,
}: PaginationBarProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const startIndex = 0;
    const endIndex = productsPerPage;
    const updatedCurrentProducts = products.slice(startIndex, endIndex);
    setFilteredProducts(updatedCurrentProducts);
  }, [products, productsPerPage, setFilteredProducts]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const updatedCurrentProducts = products.slice(startIndex, endIndex);
    setFilteredProducts(updatedCurrentProducts);
  }, [currentPage, products, productsPerPage, setFilteredProducts]);

  const paginationButtons = [...Array(totalPages)].map((_, index) => {
    const page = index + 1;
    return (
      <Button
        key={page}
        color={page !== currentPage ? 'gray-dark' : null}
        onClick={() => handlePageChange(page)}
        disabled={page === currentPage && 'style1'}
        title={`${page}`}
        borderRadius={'normal'}
        width="icon32"
      />
    );
  });

  return <Container>{paginationButtons}</Container>;
};

const Container = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2.75em;
  background-color: var(--white);
`;
