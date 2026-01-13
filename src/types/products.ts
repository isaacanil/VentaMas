export type ProductItemType = 'product' | 'service' | 'combo';

export type PricingTax =
  | number
  | string
  | { tax?: number | string }
  | null
  | undefined;

export interface ProductPricing {
  cost?: number;
  price?: number;
  listPrice?: number;
  avgPrice?: number;
  minPrice?: number;
  cardPrice?: number;
  offerPrice?: number;
  tax?: PricingTax;
  listPriceEnable?: boolean;
  avgPriceEnable?: boolean;
  minPriceEnable?: boolean;
}

export interface ProductPromotion {
  start?: unknown;
  end?: unknown;
  discount?: number;
  isActive?: boolean;
}

export interface ProductWeightDetail {
  isSoldByWeight?: boolean;
  weightUnit?: string;
  weight?: number;
}

export interface ProductWarranty {
  status?: boolean;
  unit?: string;
  quantity?: number;
}

export interface ProductSaleUnit {
  id: string;
  unitName?: string;
  quantity?: number;
  pricing: ProductPricing;
}

export interface ProductBatchInfo {
  productStockId?: string | null;
  batchId?: string | number | null;
  batchNumber?: string | number | null;
  quantity?: number | null;
  expirationDate?: number | string | null;
  locationId?: string | null;
  locationName?: string | null;
}

export interface ProductRecord extends Record<string, unknown> {
  id?: string;
  name?: string;
  productName?: string;
  brand?: string;
  brandId?: string | null;
  image?: string;
  productImageURL?: string;
  category?: string;
  itemType?: ProductItemType;
  type?: string;
  pricing?: ProductPricing;
  promotions?: ProductPromotion;
  weightDetail?: ProductWeightDetail;
  warranty?: ProductWarranty;
  size?: string;
  stock?: number;
  totalUnits?: number | null;
  packSize?: number;
  netContent?: string;
  restrictSaleWithoutStock?: boolean;
  activeIngredients?: string;
  amountToBuy?: number;
  createdBy?: string;
  isVisible?: boolean;
  trackInventory?: boolean;
  qrcode?: string;
  qrCode?: string;
  barcode?: string;
  order?: number;
  hasExpirationDate?: boolean;
  hasExpDate?: boolean;
  measurement?: string;
  footer?: string;
  saleUnits?: ProductSaleUnit[];
  selectedSaleUnit?: ProductSaleUnit | null;
  selectedSaleUnitId?: string | null;
  isSoldInUnits?: boolean;
  productStockId?: string | null;
  batchId?: string | number | null;
  batchInfo?: ProductBatchInfo | null;
}

export interface CartProductRecord extends ProductRecord {
  cid?: string;
  amountToBuy?: number;
  stock?: number;
  productStockId?: string | null;
  batchInfo?: ProductBatchInfo | null;
}

export interface ProductBrand {
  id: string;
  name: string;
}

export interface ActiveIngredient {
  id: string;
  name: string;
}

export interface ProductImageRecord {
  id: string;
  url: string;
}
