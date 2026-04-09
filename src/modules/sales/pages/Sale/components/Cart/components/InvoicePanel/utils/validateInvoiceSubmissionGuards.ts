import type { Product } from '@/features/cart/types';
import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import type { ProductRecord } from '@/types/products';
import type { UserIdentity } from '@/types/users';
import type { CashCountState } from '@/utils/cashCount/types';
import type { InventoryStockItem, InventoryUser } from '@/utils/inventory/types';
import {
  analyzeAvailableProductStocks,
  buildMissingPhysicalSelectionMessage,
} from '@/utils/inventory/productStockSelection';
import { getProductStockByProductId } from '@/firebase/warehouse/productStockService';

type GuardFailure =
  | {
      code: 'cash-count';
      cashCountState: Exclude<CashCountState, 'open'>;
      description: string;
      message: string;
      ok: false;
    }
  | {
      code: 'physical-selection';
      description: string;
      message: string;
      ok: false;
      product: ProductRecord;
    };

type GuardSuccess = {
  ok: true;
};

export type InvoiceSubmissionGuardsResult = GuardFailure | GuardSuccess;

type InvoiceSubmissionGuardsArgs = {
  cart: {
    products?: Product[] | null;
  } | null;
  user: UserIdentity | null;
};

const isProductMissingPhysicalSelection = (product: Product | null | undefined) =>
  Boolean(
    product?.restrictSaleWithoutStock &&
      (!product?.productStockId || !product?.batchId),
  );

const resolveCashCountDescription = (
  cashCountState: Exclude<CashCountState, 'open'>,
): string => {
  if (cashCountState === 'closing') {
    return 'Hay un cuadre de caja en proceso de cierre. Debes esperar a que termine o reabrirlo antes de facturar.';
  }

  if (cashCountState === 'closed') {
    return 'No hay un cuadre de caja abierto para el usuario actual. Abre uno antes de facturar.';
  }

  return 'No hay un cuadre de caja abierto para el usuario actual. Abre uno antes de facturar.';
};

export const validateInvoiceSubmissionGuards = async ({
  cart,
  user,
}: InvoiceSubmissionGuardsArgs): Promise<InvoiceSubmissionGuardsResult> => {
  if (!user?.businessID || !user?.uid) {
    return {
      ok: false,
      code: 'cash-count',
      cashCountState: 'none',
      message: 'No se pudo validar el cuadre de caja',
      description:
        'Faltan datos del usuario actual para confirmar la caja abierta antes de facturar.',
    };
  }

  const cashCountResult = await checkOpenCashReconciliation(user);
  if (cashCountResult.state !== 'open') {
    return {
      ok: false,
      code: 'cash-count',
      cashCountState: cashCountResult.state,
      message: 'No se puede facturar sin un cuadre abierto',
      description: resolveCashCountDescription(cashCountResult.state),
    };
  }

  const invalidProduct = (Array.isArray(cart?.products) ? cart.products : []).find(
    isProductMissingPhysicalSelection,
  );

  if (!invalidProduct) {
    return { ok: true };
  }

  try {
    const rawStocks = await getProductStockByProductId(user as InventoryUser, {
      productId: invalidProduct.id,
    });
    const summary = analyzeAvailableProductStocks(
      rawStocks as InventoryStockItem[],
    );

    return {
      ok: false,
      code: 'physical-selection',
      message: 'Selecciona una existencia física antes de facturar',
      description: buildMissingPhysicalSelectionMessage({
        availableLocationCount: summary.availableLocationCount,
        availableStockCount: summary.availableStockCount,
        product: invalidProduct,
      }),
      product: invalidProduct as ProductRecord,
    };
  } catch (error) {
    console.error(
      '[InvoicePanel] validateInvoiceSubmissionGuards -> inventory validation failed',
      error,
    );

    return {
      ok: false,
      code: 'physical-selection',
      message: 'Selecciona una existencia física antes de facturar',
      description: buildMissingPhysicalSelectionMessage({
        availableLocationCount: 0,
        availableStockCount: 0,
        product: invalidProduct,
      }),
      product: invalidProduct as ProductRecord,
    };
  }
};
