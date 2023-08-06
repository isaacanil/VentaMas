import { useState, useEffect } from 'react';

export const useTablePagination = (data, sortedData, filteredData, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCurrentPage(0); // Reiniciar la página actual a 0 cuando los datos cambian
  }, [data]);

  // Cálculo de páginas
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentData = sortedData.slice(start, end);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, pageCount - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const firstPage = () => setCurrentPage(0);
  const lastPage = () => setCurrentPage(pageCount - 1);

  return { currentData, nextPage, prevPage, firstPage, lastPage, currentPage, pageCount };
};


