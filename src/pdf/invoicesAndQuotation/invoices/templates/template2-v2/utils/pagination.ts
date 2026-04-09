import type { InvoicePdfProduct } from '@/pdf/invoicesAndQuotation/types';

const DEFAULT_PAGE_CAPACITY = 5.8;

const resolveRowUnits = (descriptionLineCount: number): number => {
  const extraLines = Math.max(0, descriptionLineCount - 1);
  return 1 + extraLines * 0.45;
};

export const paginateInvoiceProducts = (
  products: InvoicePdfProduct[],
  getDescriptionLineCount: (product: InvoicePdfProduct) => number,
  pageCapacity = DEFAULT_PAGE_CAPACITY,
): InvoicePdfProduct[][] => {
  if (products.length === 0) {
    return [[]];
  }

  const pages: InvoicePdfProduct[][] = [];
  let currentPage: InvoicePdfProduct[] = [];
  let currentUnits = 0;

  products.forEach((product) => {
    const rowUnits = resolveRowUnits(getDescriptionLineCount(product));

    if (currentPage.length > 0 && currentUnits + rowUnits > pageCapacity) {
      pages.push(currentPage);
      currentPage = [];
      currentUnits = 0;
    }

    currentPage.push(product);
    currentUnits += rowUnits;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};
