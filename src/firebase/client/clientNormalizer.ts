import { deleteField } from 'firebase/firestore';

export interface ClientDeliveryRaw {
  status?: boolean | number | string;
  value?: number | string;
  cash?: number | string;
  [key: string]: unknown;
}

export type ClientDeliveryInput = number | string | ClientDeliveryRaw | null;

export interface ClientInput {
  id?: string | number;
  name?: string;
  address?: string;
  email?: string;
  tel?: string;
  tel2?: string;
  personalID?: string;
  personalId?: string;
  personalIdentification?: string;
  personalIdNumber?: string;
  rnc?: string;
  rncCedula?: string;
  numberId?: number | string;
  pendingBalance?: number | string;
  delivery?: ClientDeliveryInput;
  province?: string;
  sector?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDeleted?: boolean;
  deletedAt?: unknown;
  [key: string]: unknown;
}

export interface ClientDocumentData extends Record<string, unknown> {
  client?: ClientInput;
  isDeleted?: boolean;
  deletedAt?: unknown;
}

export interface NormalizedDelivery {
  status: boolean;
  value: number;
}

export interface NormalizedClient extends Omit<
  ClientInput,
  'delivery' | 'pendingBalance'
> {
  delivery: NormalizedDelivery;
  pendingBalance: number;
}

const DEFAULT_DELIVERY: NormalizedDelivery = { status: false, value: 0 };

const FIELD_ALIASES = {
  personalId: 'personalID',
  personalIdNumber: 'personalID',
  personalIdentification: 'personalID',
  rncCedula: 'rnc',
} as const;

const FIELDS_TO_EXTRACT = [
  'address',
  'createdAt',
  'delivery',
  'email',
  'id',
  'name',
  'numberId',
  'pendingBalance',
  'personalID',
  'province',
  'sector',
  'tel',
  'tel2',
  'updatedAt',
  'rnc',
] as const;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Normaliza la estructura del objeto delivery.
 * @param {*} delivery
 * @returns {{status: boolean, value: number}}
 */
function normalizeDelivery(
  delivery: ClientDeliveryInput | undefined,
): NormalizedDelivery {
  if (delivery == null) {
    return { ...DEFAULT_DELIVERY };
  }

  if (typeof delivery === 'number') {
    const value = toNumber(delivery);
    return { status: value > 0, value };
  }

  if (typeof delivery === 'string') {
    const value = toNumber(delivery);
    return { status: value > 0, value };
  }

  if (typeof delivery === 'object' && delivery !== null) {
    const deliveryObj = delivery as ClientDeliveryRaw;
    const status = Boolean(deliveryObj.status);
    const numericValue = toNumber(deliveryObj.value);

    return {
      status,
      value: numericValue,
    };
  }

  return { ...DEFAULT_DELIVERY };
}

/**
 * Mezcla y normaliza los datos del cliente provenientes del documento de Firestore.
 * @param {object} docData
 * @returns {object}
 */
export function extractNormalizedClient(
  docData: ClientDocumentData = {},
): NormalizedClient {
  const base: ClientInput =
    docData && typeof docData.client === 'object' && docData.client !== null
      ? { ...(docData.client as ClientInput) }
      : {};

  for (const field of FIELDS_TO_EXTRACT) {
    if (docData[field] !== undefined) {
      base[field] = docData[field];
    }
  }

  for (const [alias, canonical] of Object.entries(FIELD_ALIASES)) {
    if (docData[alias] !== undefined && docData[alias] !== null) {
      base[canonical] = docData[alias];
    }
  }

  const normalized = normalizeClientObject(base);
  return normalized;
}

/**
 * Asegura que las propiedades del cliente tengan el formato esperado.
 * @param {object} client
 * @returns {object}
 */
export function normalizeClientObject(
  client: ClientInput = {},
): NormalizedClient {
  const next: ClientInput = { ...client };

  if (next.personalId && !next.personalID) {
    next.personalID = next.personalId;
  }

  if (next.personalIdentification && !next.personalID) {
    next.personalID = next.personalIdentification;
  }

  if (next.personalIdNumber && !next.personalID) {
    next.personalID = next.personalIdNumber;
  }

  if (next.rncCedula && !next.rnc) {
    next.rnc = next.rncCedula;
  }

  if (next.id != null) {
    next.id = String(next.id).trim();
  }

  if (next.numberId != null) {
    const numericValue = Number(next.numberId);
    next.numberId = Number.isNaN(numericValue) ? next.numberId : numericValue;
  }

  const pendingBalance =
    next.pendingBalance != null ? toNumber(next.pendingBalance) : 0;
  const delivery = normalizeDelivery(next.delivery);

  const normalized: NormalizedClient = {
    ...next,
    pendingBalance,
    delivery,
  };

  return normalized;
}

/**
 * Construye el payload para escribir un cliente en Firestore asegurando que
 * las propiedades duplicadas en la raíz se eliminen.
 * @param {object} client
 * @returns {{ payload: object, client: object }}
 */
export function buildClientWritePayload(client: ClientInput = {}): {
  payload: Record<string, unknown>;
  client: NormalizedClient;
} {
  const normalizedClient = normalizeClientObject(client);

  const { isDeleted, deletedAt, ...clientData } = normalizedClient;

  const payload: Record<string, unknown> = {
    client: clientData,
  };

  const cleanupKeys = new Set([
    ...Object.keys(clientData),
    ...Object.keys(FIELD_ALIASES),
  ]);

  cleanupKeys.delete('client');

  for (const key of cleanupKeys) {
    payload[key] = deleteField();
  }

  if (isDeleted === true) {
    payload.isDeleted = true;
    if (deletedAt !== undefined) payload.deletedAt = deletedAt;
  } else if (isDeleted === false) {
    payload.isDeleted = false;
    payload.deletedAt = deleteField();
  }

  return { payload, client: normalizedClient };
}

/**
 * Obtiene la lista de campos que deben eliminarse del nivel raíz de un documento.
 * Útil para funciones de limpieza que trabajan con snapshots completos.
 * @param {object} docData
 * @returns {Set<string>}
 */
export function getDuplicatedRootFields(
  docData: ClientDocumentData = {},
): Set<string> {
  const normalized = extractNormalizedClient(docData);
  const duplicated = new Set(Object.keys(normalized));

  for (const alias of Object.keys(FIELD_ALIASES)) {
    if (docData[alias] !== undefined) {
      duplicated.add(alias);
    }
  }

  return duplicated;
}

export const CLIENT_ROOT_FIELDS = new Set<string>([
  ...FIELDS_TO_EXTRACT,
  ...Object.keys(FIELD_ALIASES),
  'isDeleted',
  'deletedAt',
]);
