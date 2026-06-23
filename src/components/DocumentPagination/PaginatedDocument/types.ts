import type { ReactNode } from 'react';

export type PaginatedBlock = {
  id: string;
  content: ReactNode;
};

export type PaginatedDocumentContext = {
  isFirstPage: boolean;
  isLastPage: boolean;
  pageBlockCount: number;
  pageNumber: number;
  totalPages: number;
};

export type PaginationPageRole = 'first' | 'last' | 'middle' | 'single';

export type PageGeometry = {
  bodyGapPx: number;
  chromeGapMm: number;
  heightMm: number;
  paddingBlockMm: number;
  paddingInlineMm: number;
  widthMm: number;
};

export type PaginationMeasurements = {
  blockHeights: Record<string, number>;
  chromeHeights: Record<
    PaginationPageRole,
    {
      footerHeight: number;
      headerHeight: number;
    }
  >;
  footerHeight: number;
  headerHeight: number;
  measured: boolean;
};

export type PaginationLayout = {
  bodyCapacityPx: number;
  chromeOverflowRoles: PaginationPageRole[];
  duplicateBlockIds: string[];
  overflowBlockIds: string[];
  pageCapacitiesPx: number[];
  pages: PaginatedBlock[][];
  stable: boolean;
  unmeasuredBlockIds: string[];
};

export type PaginationRuntimeState = {
  chromeOverflowRoles: PaginationPageRole[];
  duplicateBlockIds: string[];
  measured: boolean;
  overflowBlockIds: string[];
  pageCount: number;
  readyToPrint: boolean;
  stable: boolean;
  unmeasuredBlockIds: string[];
};
