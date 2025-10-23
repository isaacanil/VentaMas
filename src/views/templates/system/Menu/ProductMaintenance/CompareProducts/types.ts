export interface ProductData {
  id?: string;
  name: string;
  brand?: string;
  barcode: string;
  category?: string;
  stock?: number;
  pricing?: {
    price?: number;
    tax?: string | number;
  };
  images?: string[];
  isVisible?: boolean;
}

export interface CompareResult {
  id: string;
  name: string;
  barcode: string;
  excelOnly: boolean;
  dbOnly: boolean;
  conflict: boolean;
  conflictFields?: string[];
  excelData?: ProductData;
  dbData?: ProductData;
  hasImages?: boolean;
}

export type MatchType = 'barcode' | 'name' | null;
