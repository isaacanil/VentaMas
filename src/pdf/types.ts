export type PdfStyle = Record<string, unknown>;
export type PdfContent = Record<string, unknown>;
export type PdfContentBlock = PdfContent | string | number;
export type PdfTableCell = PdfContentBlock;
export type PdfTableRow = PdfTableCell[];
export type PdfTableBody = PdfTableRow[];
export type PdfHeaderFooter = (...args: unknown[]) => PdfContent;
export type PdfImageMap = Record<string, string>;
export type PdfColumn = {
  width?: string | number;
  stack?: PdfContent[];
  [key: string]: unknown;
};
export type PdfColumnsBlock = {
  columns: PdfColumn[];
  [key: string]: unknown;
};

export type PdfDocDefinition = {
  images?: PdfImageMap;
  pageSize?: string | { width: number; height: number };
  pageMargins?: [number, number, number, number];
  defaultStyle?: PdfStyle;
  styles?: Record<string, PdfStyle>;
  header?: PdfHeaderFooter | PdfContent;
  content?: PdfContent[] | PdfContent;
  footer?: PdfHeaderFooter | PdfContent;
};

export type PdfMakeLike = {
  createPdf: (definition: PdfDocDefinition) => {
    getBase64: (
      onSuccess: (base64: string) => void,
      onError?: (error: unknown) => void,
    ) => void;
  };
};
