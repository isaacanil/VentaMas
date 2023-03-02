import { current } from '@reduxjs/toolkit';
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../templates/system/Button/Button'

export const PaginationBar = ({ products, setFilteredProducts, productsPerPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentProducts, setCurrentProducts] = useState([]);
  const [indexes, setIndexes] = useState({ startIndex: 0, endIndex: productsPerPage });

  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePageChange = (page) => {
    const { startIndex, endIndex } = indexes;
    const updatedCurrentProducts = products.slice(startIndex + (page - 1) * productsPerPage, endIndex + (page - 1) * productsPerPage);
    setCurrentProducts(updatedCurrentProducts);
    setFilteredProducts(updatedCurrentProducts);
    setCurrentPage(page);
  }

  useEffect(() => {
    const startIndex = 0;
    const endIndex = productsPerPage;
    const updatedCurrentProducts = products.slice(startIndex, endIndex);
    setFilteredProducts(updatedCurrentProducts);
    setCurrentProducts(updatedCurrentProducts);
  }, []);

  useEffect(() => {
    const { startIndex, endIndex } = indexes;
    const updatedCurrentProducts = products.slice(startIndex + (currentPage - 1) * productsPerPage, endIndex + (currentPage - 1) * productsPerPage);
    if (JSON.stringify(updatedCurrentProducts) !== JSON.stringify(currentProducts)) {
      setCurrentProducts(updatedCurrentProducts);
      setFilteredProducts(updatedCurrentProducts);
    }
  }, [currentPage]);

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
      >
        {page}
      </Button>
    );
  });

  return <Container>{paginationButtons}</Container>;
};







const Container = styled.div`
    height: 2.75em;
    width: 100%;
    background-color: var(--White);
    display: flex;
    align-items: center;
    gap: 0.4em;
    justify-content: center;
`