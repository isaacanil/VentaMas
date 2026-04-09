import type { SaleUnitPricing, SaleUnitRecord } from '../SaleUnit';

export type SaleUnitPricingInput = SaleUnitPricing & {
  stock?: number;
  listPriceEnabled?: boolean;
  avgPriceEnabled?: boolean;
  minPriceEnabled?: boolean;
};

export type SaleUnitFormValues = {
  unitName: string;
  packSize: number;
  pricing: SaleUnitPricingInput;
};

export type SaleUnitFormProps = {
  isOpen: boolean;
  initialValues: SaleUnitRecord | null;
  onSubmit: () => void;
  onCancel: () => void;
};

export type PriceCardRow = {
  key: string;
  tipoPrecio: string;
  precioSinItbis: string;
  itbis: string;
  total: string;
  margen: string;
  porcentajeGanancia: string;
};
