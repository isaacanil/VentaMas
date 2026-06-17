import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCashRegister,
  faClipboardList,
  faFileInvoice,
  faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';

export interface AuthorizationModuleMeta {
  moduleKey: string;
  title: string;
  summary: string;
  referenceLabel: string;
  icon: IconDefinition;
}

type AuthorizationModuleMetaSource = {
  module?: unknown;
  type?: unknown;
  collectionKey?: unknown;
  invoiceId?: unknown;
  metadata?: Record<string, unknown> | null;
};

type MetadataMap = Record<string, AuthorizationModuleMeta>;

const LEGACY_COLLECTION_KEY = 'invoiceEditAuthorizations';

const metadataMap: MetadataMap = {
  invoices: {
    moduleKey: 'invoices',
    title: 'Edición de factura',
    summary: 'Solicitud para editar una factura registrada.',
    referenceLabel: 'Factura',
    icon: faFileInvoiceDollar,
  },
  accountsReceivable: {
    moduleKey: 'accountsReceivable',
    title: 'Autorización de caja',
    summary: 'Solicitud relacionada con cuadre de caja o cuentas por cobrar.',
    referenceLabel: 'Transacción',
    icon: faCashRegister,
  },
  cashRegister: {
    moduleKey: 'accountsReceivable',
    title: 'Autorización de caja',
    summary: 'Solicitud relacionada con operaciones de caja.',
    referenceLabel: 'Transacción',
    icon: faCashRegister,
  },
  creditNotes: {
    moduleKey: 'creditNotes',
    title: 'Autorización de nota de crédito',
    summary: 'Solicitud para aprobar una nota de crédito.',
    referenceLabel: 'Nota de crédito',
    icon: faFileInvoice,
  },
  generic: {
    moduleKey: 'generic',
    title: 'Solicitud de autorización',
    summary: 'Flujo de autorización en proceso.',
    referenceLabel: 'Referencia',
    icon: faClipboardList,
  },
};

export const resolveModuleMeta = (
  request: AuthorizationModuleMetaSource | null | undefined,
): AuthorizationModuleMeta => {
  const metadataModule =
    typeof request?.metadata === 'object' && request?.metadata !== null
      ? request.metadata?.['module']
      : undefined;

  const rawModule =
    (typeof request?.module === 'string' && request?.module) ||
    (typeof metadataModule === 'string' && metadataModule) ||
    (typeof request?.type === 'string' && request.type) ||
    (typeof request?.collectionKey === 'string' && request.collectionKey) ||
    (request?.invoiceId ? 'invoices' : undefined);

  const normalizedModule = (() => {
    if (!rawModule) return 'generic';
    if (rawModule === 'authorizationRequests') return 'generic';
    if (rawModule === 'cashRegister') return 'accountsReceivable';
    if (rawModule === LEGACY_COLLECTION_KEY) return 'invoices';
    return rawModule;
  })();

  return metadataMap[normalizedModule] || metadataMap.generic;
};
