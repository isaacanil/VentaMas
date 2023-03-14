import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../../../templates/system/Button/Button';

export const PaginationBar = ({ products, setFilteredProducts, productsPerPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentProducts, setCurrentProducts] = useState([]);
  const [indexes, setIndexes] = useState({ startIndex: 0, endIndex: productsPerPage });

  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const startIndex = 0;
    const endIndex = productsPerPage;
    const updatedCurrentProducts = products.slice(startIndex, endIndex);
    setFilteredProducts(updatedCurrentProducts);
    setCurrentProducts(updatedCurrentProducts);
  }, [products, productsPerPage, setFilteredProducts]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const updatedCurrentProducts = products.slice(startIndex, endIndex);
    setCurrentProducts(updatedCurrentProducts);
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
    height: 2.75em;
    width: 100%;
    background-color: var(--White);
    display: flex;
    align-items: center;
    gap: 0.4em;
    justify-content: center;
`