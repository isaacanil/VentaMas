import { useState, useEffect } from 'react';

const scrollToTopOfWrapper = (wrapperRef) => {
  if (wrapperRef?.current) {
    wrapperRef.current.scrollTop = 0;
  }
};

export const useTablePagination = (
  data,
  sortedData,
  filteredData,
  itemsPerPage = 15,
  wrapperRef,
) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Preservar la página actual cuando cambian los datos.
  // Solo ajustar si la página actual queda fuera de rango cuando cambia el total filtrado o el page size.
  useEffect(() => {
    const newPageCount = Math.max(
      1,
      Math.ceil((filteredData?.length || 0) / itemsPerPage),
    );
    setCurrentPage((prev) => {
      if (prev > newPageCount - 1) return newPageCount - 1;
      return prev;
    });
  }, [filteredData?.length, itemsPerPage]);

  // Cálculo de páginas
  const pageCount = Math.ceil((filteredData?.length || 0) / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentData = sortedData.slice(start, end);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pageCount - 1));
    scrollToTopOfWrapper(wrapperRef);
  };
  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
    scrollToTopOfWrapper(wrapperRef);
  };
  const firstPage = () => {
    setCurrentPage(0);
    scrollToTopOfWrapper(wrapperRef);
  };
  const lastPage = () => {
    setCurrentPage(pageCount - 1);
    scrollToTopOfWrapper(wrapperRef);
  };

  return {
    currentData,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    currentPage,
    pageCount,
  };
};
