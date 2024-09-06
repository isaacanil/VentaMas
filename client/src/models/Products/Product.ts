export interface Product {
    id: string;
    productName: string;
    productImageURL?: string;
    category: string;
    pricing: {
      cost: number;
      price: number;
      listPrice?: number;
      avgPrice?: number;
      minPrice?: number;
      tax: string; // Reference or type definition for tax details
    };
    promotions?: {
      start?: Date;
      end?: Date;
      discount?: number;
      isActive?: boolean;
    };
    weightDetail?: {
      isSoldByWeight?: boolean;
      weightUnit?: string;
      weight?: number;
    };
    warranty?: {
      status?: boolean;
      unit?: string;
      quantity?: number;
    };
    size?: string;
    type?: string;
    stock: number;
    netContent?: string;
    amountToBuy?: number;
    createdBy?: string;
    isVisible?: boolean;
    trackInventory?: boolean;
    qrcode?: string;
    barcode?: string;
    hasExpDate: boolean; // New field for expiration date control
  }
  