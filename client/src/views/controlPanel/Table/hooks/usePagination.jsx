import { useState, useEffect } from 'react';
const scrollToTopOfWrapper = (wrapperRef) => {
  if (wrapperRef.current) {
    wrapperRef.current.scrollTop = 0;
  }
};
export const useTablePagination = (data, sortedData, filteredData, itemsPerPage = 15, wrapperRef) => {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCurrentPage(0); // Reiniciar la página actual a 0 cuando los datos cambian
  }, [data]);

  // Cálculo de páginas
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentData = sortedData.slice(start, end);

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pageCount - 1))
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
  const lastPage = () =>{ 
    setCurrentPage(pageCount - 1)
    scrollToTopOfWrapper(wrapperRef);};

  return { currentData, nextPage, prevPage, firstPage, lastPage, currentPage, pageCount };
};


