import type { Dispatch, SetStateAction } from 'react';

import { VmPagination } from '@/components/heroui';

import { FooterMeta } from '../ServiceCommissionsReport.styles';

const getVisiblePages = (currentPage: number, totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1),
  );

interface ReportPaginationProps {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
}

export const ReportPagination = ({
  currentPage,
  setCurrentPage,
  totalPages,
}: ReportPaginationProps) => {
  if (totalPages <= 1) return <FooterMeta>Pagina 1 de 1</FooterMeta>;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <VmPagination aria-label="Paginacion del reporte de comisiones">
      <VmPagination.Content>
        <VmPagination.Item>
          <VmPagination.Previous
            isDisabled={currentPage === 1}
            onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <VmPagination.PreviousIcon />
          </VmPagination.Previous>
        </VmPagination.Item>
        {visiblePages.flatMap((page, index) => {
          const previous = visiblePages[index - 1];
          const showGap = previous && page - previous > 1;
          const items = [];

          if (showGap) {
            items.push(
              <VmPagination.Item key={`gap-${page}`}>
                <VmPagination.Ellipsis />
              </VmPagination.Item>,
            );
          }

          items.push(
            <VmPagination.Item key={`page-${page}`}>
              <VmPagination.Link
                isActive={page === currentPage}
                onPress={() => setCurrentPage(page)}
              >
                {page}
              </VmPagination.Link>
            </VmPagination.Item>,
          );

          return items;
        })}
        <VmPagination.Item>
          <VmPagination.Next
            isDisabled={currentPage === totalPages}
            onPress={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            <VmPagination.NextIcon />
          </VmPagination.Next>
        </VmPagination.Item>
      </VmPagination.Content>
    </VmPagination>
  );
};
