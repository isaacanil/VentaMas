import type { Product } from '@/features/cart/types';
import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import type { ServiceCommissionsBillingSettings } from '@/types/commissions';
import type { ProductRecord } from '@/types/products';
import type { UserIdentity } from '@/types/users';
import type { CashCountState } from '@/utils/cashCount/types';
import {
  getServiceCommissionCollaboratorLabel,
  isServiceCommissionEligible,
  isServiceCommissionLineEligible,
  normalizeServiceCommissionSettings,
} from '@/utils/commissions/serviceCommissions';
import type {
  InventoryStockItem,
  InventoryUser,
} from '@/utils/inventory/types';
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
    }
  | {
      code: 'service-commission-collaborator';
      description: string;
      message: string;
      ok: false;
      product: Product;
    }
  | {
      code: 'service-commission-collaborator-ineligible';
      description: string;
      message: string;
      ok: false;
      product: Product;
    };

type GuardSuccess = {
  ok: true;
};

export type InvoiceSubmissionGuardsResult = GuardFailure | GuardSuccess;

type InvoiceSubmissionGuardsArgs = {
  cart: {
    products?: Product[] | null;
  } | null;
  serviceCommissions?: ServiceCommissionsBillingSettings | null;
  user: UserIdentity | null;
};

const isProductMissingPhysicalSelection = (
  product: Product | null | undefined,
) =>
  Boolean(
    product?.restrictSaleWithoutStock &&
    (!product?.productStockId || !product?.batchId),
  );

const isServiceMissingCommissionCollaborator = (
  product: Product | null | undefined,
): boolean =>
  Boolean(
    product &&
    isServiceCommissionEligible(product) &&
    !getServiceCommissionCollaboratorLabel(product.serviceCommission),
  );

const isServiceWithIneligibleCommissionCollaborator = (
  product: Product | null | undefined,
): boolean =>
  Boolean(
    product &&
    isServiceCommissionEligible(product) &&
    getServiceCommissionCollaboratorLabel(product.serviceCommission) &&
    !isServiceCommissionLineEligible(product.serviceCommission, product),
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
  serviceCommissions,
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

  const invalidProduct = (
    Array.isArray(cart?.products) ? cart.products : []
  ).find(isProductMissingPhysicalSelection);

  if (!invalidProduct) {
    const commissionSettings =
      normalizeServiceCommissionSettings(serviceCommissions);
    if (commissionSettings.enabled) {
      const serviceWithIneligibleCollaborator = (
        Array.isArray(cart?.products) ? cart.products : []
      ).find(isServiceWithIneligibleCommissionCollaborator);

      if (serviceWithIneligibleCollaborator) {
        return {
          ok: false,
          code: 'service-commission-collaborator-ineligible',
          message: 'Configura la comisión del colaborador',
          description:
            'El colaborador asignado no tiene una comisión configurada y no es elegible para comisiones. Configúralo en RRHH antes de facturar.',
          product: serviceWithIneligibleCollaborator,
        };
      }
    }

    if (
      commissionSettings.enabled &&
      commissionSettings.requireCollaboratorOnService
    ) {
      const serviceWithoutCollaborator = (
        Array.isArray(cart?.products) ? cart.products : []
      ).find(isServiceMissingCommissionCollaborator);

      if (serviceWithoutCollaborator) {
        return {
          ok: false,
          code: 'service-commission-collaborator',
          message: 'Asigna un colaborador al servicio',
          description:
            'La configuración de comisiones exige un colaborador en cada servicio antes de facturar.',
          product: serviceWithoutCollaborator,
        };
      }
    }

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
        product: invalidProduct as unknown as ProductRecord,
      }),
      product: invalidProduct as unknown as ProductRecord,
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
        product: invalidProduct as unknown as ProductRecord,
      }),
      product: invalidProduct as unknown as ProductRecord,
    };
  }
};
