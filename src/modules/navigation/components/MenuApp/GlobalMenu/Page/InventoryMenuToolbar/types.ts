export type ImportProgressStats = {
  totalProducts: number;
  processedProducts: number;
  updatedProducts: number;
  newProducts: number;
  newCategories: number;
  newIngredients: number;
  updatedIngredients: number;
};

export type ImportOptions = {
  dryRun?: boolean;
};

export type InventoryProduct = {
  activeIngredients?: string | null;
  pricing?: { tax?: number | string | null };
} & Record<string, unknown>;
