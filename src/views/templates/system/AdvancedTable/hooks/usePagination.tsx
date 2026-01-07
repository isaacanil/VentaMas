// @ts-nocheck
import { useState } from 'react';

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

  const total = filteredData?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / itemsPerPage));

  const clampedPage = Math.min(currentPage, pageCount - 1);
  if (clampedPage !== currentPage) {
    setCurrentPage(clampedPage);
  }

  const start = clampedPage * itemsPerPage;
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
