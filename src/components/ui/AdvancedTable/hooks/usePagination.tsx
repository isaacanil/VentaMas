import { useState, type RefObject } from 'react';
import type { TableRow } from '../types/ColumnTypes';

const scrollToTopOfWrapper = (wrapperRef?: RefObject<HTMLElement>) => {
  if (wrapperRef?.current) {
    wrapperRef.current.scrollTop = 0;
  }
};

export const useTablePagination = <RowData extends TableRow>(
  data: RowData[],
  sortedData: RowData[],
  filteredData: RowData[],
  itemsPerPage = 15,
  wrapperRef?: RefObject<HTMLElement>,
) => {
  const [currentPage, setCurrentPage] = useState(0);

  const total = filteredData?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / itemsPerPage));
  const clampedPage = Math.min(currentPage, pageCount - 1);

  const start = clampedPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentData = sortedData.slice(start, end);

  const nextPage = () => {
    setCurrentPage((prev) =>
      Math.min(Math.min(prev, pageCount - 1) + 1, pageCount - 1),
    );
    scrollToTopOfWrapper(wrapperRef);
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(Math.min(prev, pageCount - 1) - 1, 0));
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
    currentPage: clampedPage,
    pageCount,
  };
};
