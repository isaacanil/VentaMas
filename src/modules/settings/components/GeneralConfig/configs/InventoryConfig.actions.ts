import type { selectUser } from '@/features/auth/userSlice';
import { fbRecalculateProductStockTotals } from '@/firebase/inventory/recalculateProductStockTotals';
import { setDefaultWarehouse } from '@/firebase/warehouse/warehouseService';

type CurrentUser = ReturnType<typeof selectUser>;

export type InventoryActionResult =
  | {
      status: 'success';
      updatedProducts?: number;
    }
  | {
      errorMessage: string;
      status: 'error';
    };

export const saveDefaultWarehouse = async ({
  user,
  warehouseId,
}: {
  user: CurrentUser;
  warehouseId: string;
}): Promise<InventoryActionResult> => {
  try {
    await setDefaultWarehouse(user, warehouseId);
    return {
      status: 'success',
    };
  } catch (error: unknown) {
    return {
      status: 'error',
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Error al actualizar el almacen predeterminado.',
    };
  }
};

export const recalculateInventoryStock = async ({
  user,
}: {
  user: CurrentUser;
}): Promise<InventoryActionResult> => {
  try {
    const summary = (await fbRecalculateProductStockTotals(user)) as {
      productsUpdated?: number;
    };
    return {
      status: 'success',
      updatedProducts: Number(summary?.productsUpdated ?? 0),
    };
  } catch (error: unknown) {
    return {
      status: 'error',
      errorMessage:
        error instanceof Error
          ? error.message
          : 'No se pudo recalcular el stock agregado.',
    };
  }
};
