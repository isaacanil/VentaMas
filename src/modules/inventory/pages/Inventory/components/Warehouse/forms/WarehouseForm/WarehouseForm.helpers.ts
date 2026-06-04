import type { WarehouseFormData } from './WarehouseForm.types';

const DEFAULT_DIMENSION = { length: 0, width: 0, height: 0 };

export const getWarehouseFormInitialValues = (
  formData: WarehouseFormData | null | undefined,
): WarehouseFormData | null => {
  if (!formData) return null;

  return {
    ...formData,
    dimension: formData.dimension || DEFAULT_DIMENSION,
    capacity: formData.capacity || 0,
  };
};

export const buildWarehousePayload = (rawValues: WarehouseFormData) => ({
  name: rawValues.name || '',
  shortName: rawValues.shortName || '',
  description: rawValues.description || '',
  owner: rawValues.owner || '',
  location: rawValues.location || '',
  address: rawValues.address || '',
  dimension: {
    length: Number(rawValues.dimension?.length ?? 0),
    width: Number(rawValues.dimension?.width ?? 0),
    height: Number(rawValues.dimension?.height ?? 0),
  },
  capacity: Number(rawValues.capacity ?? 0),
});
