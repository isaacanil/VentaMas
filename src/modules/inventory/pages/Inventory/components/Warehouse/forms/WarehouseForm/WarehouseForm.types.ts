import type { selectWarehouseModalState } from '@/features/warehouse/warehouseModalSlice';

export type WarehouseFormState = ReturnType<typeof selectWarehouseModalState>;

export type WarehouseFormData = WarehouseFormState['formData'];
