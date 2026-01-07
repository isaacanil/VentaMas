// @ts-nocheck
import { deleteField } from 'firebase/firestore';

const DEFAULT_DELIVERY = { status: false, value: 0 };

const FIELD_ALIASES = {
  personalId: 'personalID',
  personalIdNumber: 'personalID',
  personalIdentification: 'personalID',
  rncCedula: 'rnc',
};

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
];

/**
 * Normaliza la estructura del objeto delivery.
 * @param {*} delivery
 * @returns {{status: boolean, value: number}}
 */
function normalizeDelivery(delivery) {
  if (delivery == null) {
    return { ...DEFAULT_DELIVERY };
  }

  if (typeof delivery === 'number') {
    const value = Number.isFinite(delivery) ? delivery : Number(delivery) || 0;
    return { status: value > 0, value };
  }

  if (typeof delivery === 'object') {
    const status = Boolean(delivery.status);
    const numericValue = Number.isFinite(delivery.value)
      ? delivery.value
      : Number(delivery.value) || 0;

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
export function extractNormalizedClient(docData = {}) {
  const base =
    docData && typeof docData.client === 'object' && docData.client !== null
      ? { ...docData.client }
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
export function normalizeClientObject(client = {}) {
  const next = { ...client };

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

  if (next.pendingBalance != null) {
    const numericBalance = Number(next.pendingBalance);
    next.pendingBalance = Number.isNaN(numericBalance) ? 0 : numericBalance;
  } else {
    next.pendingBalance = 0;
  }

  next.delivery = normalizeDelivery(next.delivery);

  return next;
}

/**
 * Construye el payload para escribir un cliente en Firestore asegurando que
 * las propiedades duplicadas en la raíz se eliminen.
 * @param {object} client
 * @returns {{ payload: object, client: object }}
 */
export function buildClientWritePayload(client = {}) {
  const normalizedClient = normalizeClientObject(client);

  const { isDeleted, deletedAt, ...clientData } = normalizedClient;

  const payload = {
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
export function getDuplicatedRootFields(docData = {}) {
  const normalized = extractNormalizedClient(docData);
  const duplicated = new Set(Object.keys(normalized));

  for (const alias of Object.keys(FIELD_ALIASES)) {
    if (docData[alias] !== undefined) {
      duplicated.add(alias);
    }
  }

  return duplicated;
}

export const CLIENT_ROOT_FIELDS = new Set([
  ...FIELDS_TO_EXTRACT,
  ...Object.keys(FIELD_ALIASES),
  'isDeleted',
  'deletedAt',
]);
