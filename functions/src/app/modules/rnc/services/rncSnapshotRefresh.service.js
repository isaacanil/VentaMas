import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';

import { Unzip, UnzipInflate } from 'fflate';

import { logger } from 'firebase-functions';

import { storage } from '../../../core/config/firebase.js';
import {
  RNC_SNAPSHOT_MANIFEST_SCHEMA_VERSION,
  buildVersionedRncManifestPath,
  buildVersionedRncSnapshotPath,
  parseRncCurrentManifest,
  parseRncSnapshotManifest,
  resolveRncCurrentManifestPath,
  resolveRncLegacySqliteStoragePath,
  resolveRncSnapshotManifestPrefix,
  resolveRncSnapshotPrefix,
} from '../utils/rncSnapshotManifest.util.js';
import { resolveRncStorageBucketName } from '../utils/rncStorage.util.js';
import { normalizeRncNumber } from '../utils/rncValidation.util.js';

const DEFAULT_SOURCE_URL =
  'https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip';
const DEFAULT_REFERER =
  'https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx';
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 4 * 60 * 1000;
const REFRESH_TIMEOUT_MS = 9 * 60 * 1000;
const MIN_POST_DOWNLOAD_BUDGET_MS = 4 * 60 * 1000;
const DEFAULT_EXPECTED_ENTRY_NAME = 'TMP/DGII_RNC.TXT';
const DEFAULT_MAX_NULL_CONDITION_ROWS = 1000;
const DEFAULT_MAX_NULL_FULL_NAME_ROWS = 0;
const DEFAULT_MAX_NULL_STATUS_ROWS = 0;
const DEFAULT_MAX_ROW_COUNT_INCREASE_RATIO = 0.3;
const DEFAULT_MAX_ROW_COUNT_DROP_RATIO = 0.15;
const DEFAULT_MAX_SKIPPED_ROWS = 1000;
const DEFAULT_MAX_DUPLICATE_RNC_RATIO = 0.01;
const DEFAULT_MAX_DUPLICATE_RNC_RATIO_INCREASE = 0.005;
const DEFAULT_MAX_SQLITE_BYTES = 512 * 1024 * 1024;
const DEFAULT_MAX_TEXT_BYTES = 512 * 1024 * 1024;
const DEFAULT_MAX_ZIP_BYTES = 128 * 1024 * 1024;
const DEFAULT_MAX_ZIP_ENTRIES = 16;
const DEFAULT_MAX_ZIP_CENTRAL_DIRECTORY_BYTES = 64 * 1024;
const DEFAULT_MAX_DGII_LINE_BYTES = 256 * 1024;
const DEFAULT_MAX_DGII_FIELD_BYTES = 64 * 1024;
const DEFAULT_MIN_ROW_COUNT = 500000;
const RNC_SQLITE_USER_VERSION = 1;
const DEFAULT_VALIDATION_RNC_NUMBERS = Object.freeze([
  '401506254',
  '101027797',
  '101000155',
]);
const DEFAULT_VALIDATION_RNC_RECORDS = Object.freeze([
  Object.freeze({
    rnc: '101027797',
    full_name: '3 M DOMINICANA SRL',
    status: 'ACTIVO',
    condition: 'NORMAL',
  }),
]);
const RNC_EXPECTED_FIELD_COUNT = 11;
const RNC_PARSER_VERSION = '2026-06-18.1';
const RNC_TABLE_SCHEMA = `
  CREATE TABLE rnc (
    rnc_number TEXT PRIMARY KEY,
    full_name TEXT,
    business_name TEXT,
    business_activity TEXT,
    category TEXT,
    payment_regime TEXT,
    field_6 TEXT,
    field_7 TEXT,
    registration_date TEXT,
    status TEXT,
    condition TEXT,
    raw_fields_json TEXT,
    source_updated_at TEXT
  );
`;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const hasOwnEnvValue = (env, key) =>
  Object.prototype.hasOwnProperty.call(env, key);

const parsePositiveIntegerConfig = ({ defaultValue, key, value }) => {
  const rawValue = toCleanString(value);
  if (!rawValue) return defaultValue;

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${key} debe ser un entero positivo.`);
  }

  return parsedValue;
};

const capDownloadTimeoutMs = (timeoutMs) =>
  Math.min(timeoutMs, REFRESH_TIMEOUT_MS - MIN_POST_DOWNLOAD_BUDGET_MS);

const parseNonNegativeIntegerConfig = ({ defaultValue, key, value }) => {
  const rawValue = toCleanString(value);
  if (!rawValue) return defaultValue;

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${key} debe ser un entero no negativo.`);
  }

  return parsedValue;
};

const parseRatioConfig = ({ defaultValue, key, value }) => {
  const rawValue = toCleanString(value);
  if (!rawValue) return defaultValue;

  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    throw new Error(`${key} debe ser un numero entre 0 y 1.`);
  }

  return parsedValue;
};

const parseOptionalIsoDateConfig = ({ key, value }) => {
  const rawValue = toCleanString(value);
  if (!rawValue) return null;

  if (!Number.isFinite(Date.parse(rawValue))) {
    throw new Error(`${key} debe ser una fecha ISO valida.`);
  }

  return rawValue;
};

const parseSha256ListConfig = ({ key, value }) => {
  if (typeof value !== 'string' || !value.trim()) return [];

  return [
    ...new Set(
      value
        .split(/[,\s;]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
        .map((entry) => {
          if (!/^[a-f0-9]{64}$/.test(entry)) {
            throw new Error(`${key} contiene un sha256 invalido.`);
          }

          return entry;
        }),
    ),
  ];
};

const parseValidationRncNumbers = (value) => {
  if (typeof value !== 'string') return [];

  const values = value
    .split(/[,\s;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [
    ...new Set(
      values.map((entry) => {
        try {
          return normalizeRncNumber(entry);
        } catch (_error) {
          throw new Error(
            `RNC de validacion invalido para snapshot RNC: ${entry}`,
          );
        }
      }),
    ),
  ];
};

const resolveValidationRncNumbers = ({ env }) => {
  if (hasOwnEnvValue(env, 'RNC_SNAPSHOT_VALIDATE_RNCS')) {
    return parseValidationRncNumbers(env.RNC_SNAPSHOT_VALIDATE_RNCS);
  }

  if (hasOwnEnvValue(env, 'RNC_SNAPSHOT_KNOWN_RNCS')) {
    return parseValidationRncNumbers(env.RNC_SNAPSHOT_KNOWN_RNCS);
  }

  return [...DEFAULT_VALIDATION_RNC_NUMBERS];
};

const normalizeValidationRecord = (record) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Registro de validacion RNC invalido.');
  }

  const rnc = normalizeRncNumber(record.rnc ?? record.rnc_number);
  return {
    rnc,
    ...(toCleanString(record.full_name) ? { full_name: toCleanString(record.full_name) } : {}),
    ...(toCleanString(record.status) ? { status: toCleanString(record.status) } : {}),
    ...(toCleanString(record.condition) ? { condition: toCleanString(record.condition) } : {}),
  };
};

const parseValidationRncRecords = (value) => {
  if (typeof value !== 'string' || !value.trim()) return [];

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (_error) {
    throw new Error('RNC_SNAPSHOT_VALIDATE_RECORDS_JSON debe ser JSON valido.');
  }

  const records = Array.isArray(parsed) ? parsed : Object.values(parsed);
  return records.map(normalizeValidationRecord);
};

const resolveValidationRncRecords = ({ env }) => {
  if (hasOwnEnvValue(env, 'RNC_SNAPSHOT_VALIDATE_RECORDS_JSON')) {
    return parseValidationRncRecords(env.RNC_SNAPSHOT_VALIDATE_RECORDS_JSON);
  }

  if (
    hasOwnEnvValue(env, 'RNC_SNAPSHOT_VALIDATE_RNCS') ||
    hasOwnEnvValue(env, 'RNC_SNAPSHOT_KNOWN_RNCS')
  ) {
    return [];
  }

  return DEFAULT_VALIDATION_RNC_RECORDS.map((record) => ({ ...record }));
};

const resolveRefreshConfig = ({ env = process.env } = {}) => ({
  bucketName: resolveRncStorageBucketName({ env }),
  currentManifestPath: resolveRncCurrentManifestPath({ env }),
  downloadTimeoutMs: capDownloadTimeoutMs(
    parsePositiveIntegerConfig({
      defaultValue: DEFAULT_DOWNLOAD_TIMEOUT_MS,
      key: 'RNC_DGII_DOWNLOAD_TIMEOUT_MS',
      value: env.RNC_DGII_DOWNLOAD_TIMEOUT_MS,
    }),
  ),
  expectedEntryName:
    toCleanString(env.RNC_DGII_EXPECTED_ENTRY) ??
    toCleanString(env.RNC_DGII_EXPECTED_ENTRY_NAME) ??
    DEFAULT_EXPECTED_ENTRY_NAME,
  ignoreRollbackHold: env.RNC_SNAPSHOT_IGNORE_ROLLBACK_HOLD === 'true',
  legacyStoragePath: resolveRncLegacySqliteStoragePath({ env }),
  manifestPrefix: resolveRncSnapshotManifestPrefix({ env }),
  maxNullConditionRows: parseNonNegativeIntegerConfig({
    defaultValue: DEFAULT_MAX_NULL_CONDITION_ROWS,
    key: 'RNC_SNAPSHOT_MAX_NULL_CONDITION_ROWS',
    value: env.RNC_SNAPSHOT_MAX_NULL_CONDITION_ROWS,
  }),
  maxNullFullNameRows: parseNonNegativeIntegerConfig({
    defaultValue: DEFAULT_MAX_NULL_FULL_NAME_ROWS,
    key: 'RNC_SNAPSHOT_MAX_NULL_FULL_NAME_ROWS',
    value: env.RNC_SNAPSHOT_MAX_NULL_FULL_NAME_ROWS,
  }),
  maxNullStatusRows: parseNonNegativeIntegerConfig({
    defaultValue: DEFAULT_MAX_NULL_STATUS_ROWS,
    key: 'RNC_SNAPSHOT_MAX_NULL_STATUS_ROWS',
    value: env.RNC_SNAPSHOT_MAX_NULL_STATUS_ROWS,
  }),
  maxRowCountDropRatio: parseRatioConfig({
    defaultValue: DEFAULT_MAX_ROW_COUNT_DROP_RATIO,
    key: 'RNC_SNAPSHOT_MAX_ROW_COUNT_DROP_RATIO',
    value: env.RNC_SNAPSHOT_MAX_ROW_COUNT_DROP_RATIO,
  }),
  maxRowCountIncreaseRatio: parseRatioConfig({
    defaultValue: DEFAULT_MAX_ROW_COUNT_INCREASE_RATIO,
    key: 'RNC_SNAPSHOT_MAX_ROW_COUNT_INCREASE_RATIO',
    value: env.RNC_SNAPSHOT_MAX_ROW_COUNT_INCREASE_RATIO,
  }),
  maxSkippedRows: parseNonNegativeIntegerConfig({
    defaultValue: DEFAULT_MAX_SKIPPED_ROWS,
    key: 'RNC_SNAPSHOT_MAX_SKIPPED_ROWS',
    value: env.RNC_SNAPSHOT_MAX_SKIPPED_ROWS,
  }),
  maxDuplicateRncCount: parseNonNegativeIntegerConfig({
    defaultValue: null,
    key: 'RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT',
    value:
      env.RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT ??
      env.RNC_SNAPSHOT_MAX_DUPLICATE_RNC_ROWS,
  }),
  maxDuplicateRncRatioIncrease: parseRatioConfig({
    defaultValue: DEFAULT_MAX_DUPLICATE_RNC_RATIO_INCREASE,
    key: 'RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO_INCREASE',
    value:
      env.RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO_INCREASE ??
      env.RNC_SNAPSHOT_MAX_DUPLICATE_RNC_INCREASE_RATIO,
  }),
  maxDuplicateRncRatio: parseRatioConfig({
    defaultValue: DEFAULT_MAX_DUPLICATE_RNC_RATIO,
    key: 'RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO',
    value: env.RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO,
  }),
  maxSqliteBytes: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_SQLITE_BYTES,
    key: 'RNC_SNAPSHOT_MAX_SQLITE_BYTES',
    value: env.RNC_SNAPSHOT_MAX_SQLITE_BYTES,
  }),
  maxTextBytes: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_TEXT_BYTES,
    key: 'RNC_DGII_MAX_TEXT_BYTES',
    value: env.RNC_DGII_MAX_TEXT_BYTES,
  }),
  maxZipBytes: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_ZIP_BYTES,
    key: 'RNC_DGII_MAX_ZIP_BYTES',
    value: env.RNC_DGII_MAX_ZIP_BYTES,
  }),
  maxZipEntries: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_ZIP_ENTRIES,
    key: 'RNC_DGII_MAX_ZIP_ENTRIES',
    value: env.RNC_DGII_MAX_ZIP_ENTRIES,
  }),
  maxZipCentralDirectoryBytes: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_ZIP_CENTRAL_DIRECTORY_BYTES,
    key: 'RNC_DGII_MAX_ZIP_CENTRAL_DIRECTORY_BYTES',
    value:
      env.RNC_DGII_MAX_ZIP_CENTRAL_DIRECTORY_BYTES ??
      env.RNC_DGII_MAX_CENTRAL_DIRECTORY_BYTES,
  }),
  maxDgiiLineBytes: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_DGII_LINE_BYTES,
    key: 'RNC_DGII_MAX_LINE_BYTES',
    value: env.RNC_DGII_MAX_LINE_BYTES,
  }),
  maxDgiiFieldBytes: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MAX_DGII_FIELD_BYTES,
    key: 'RNC_DGII_MAX_FIELD_BYTES',
    value: env.RNC_DGII_MAX_FIELD_BYTES,
  }),
  minRowCount: parsePositiveIntegerConfig({
    defaultValue: DEFAULT_MIN_ROW_COUNT,
    key: 'RNC_SNAPSHOT_MIN_ROW_COUNT',
    value:
      env.RNC_SNAPSHOT_MIN_ROW_COUNT ??
      env.RNC_SNAPSHOT_MIN_ROWS,
  }),
  rejectedSha256List: parseSha256ListConfig({
    key: 'RNC_SNAPSHOT_REJECTED_SHA256_LIST',
    value: env.RNC_SNAPSHOT_REJECTED_SHA256_LIST,
  }),
  rollbackHoldUntil: parseOptionalIsoDateConfig({
    key: 'RNC_SNAPSHOT_ROLLBACK_HOLD_UNTIL',
    value: env.RNC_SNAPSHOT_ROLLBACK_HOLD_UNTIL,
  }),
  snapshotPrefix: resolveRncSnapshotPrefix({ env }),
  sourceUrl: toCleanString(env.RNC_DGII_SOURCE_URL) ?? DEFAULT_SOURCE_URL,
  skipUnchangedZip: env.RNC_SNAPSHOT_SKIP_UNCHANGED_ZIP !== 'false',
  validationRncNumbers: resolveValidationRncNumbers({ env }),
  validationRncRecords: resolveValidationRncRecords({ env }),
});

const createWorkDir = async () => {
  const workDir = path.join(
    tmpdir(),
    `ventamas-rnc-refresh-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
  );
  await mkdir(workDir, { recursive: true });
  return workDir;
};

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP64_SENTINEL = 0xffffffff;
const ZIP64_ENTRY_SENTINEL = 0xffff;
const ZIP_MAX_EOCD_SEARCH_BYTES = 65558;
const ZIP_COMPRESSION_STORE = 0;
const ZIP_COMPRESSION_DEFLATE = 8;
const ZIP_GENERAL_PURPOSE_ENCRYPTED = 0x0001;
const ZIP_GENERAL_PURPOSE_DATA_DESCRIPTOR = 0x0008;
const ZIP_UNIX_PLATFORM = 3;
const ZIP_UNIX_FILE_TYPE_MASK = 0o170000;
const ZIP_UNIX_REGULAR_FILE = 0o100000;
const ZIP_UNIX_DIRECTORY = 0o040000;
const ZIP_UNIX_SYMLINK = 0o120000;

const buildCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[index] = crc >>> 0;
  }
  return table;
};

const CRC32_TABLE = buildCrc32Table();

const calculateCrc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const formatZipUInt32 = (value) =>
  (value >>> 0).toString(16).padStart(8, '0');

const normalizeZipEntryName = (name) =>
  String(name ?? '').replace(/\\/g, '/');

const normalizeComparableZipEntryName = (name) =>
  normalizeZipEntryName(name).replace(/\/+$/g, '').toLowerCase();

const isUnsafeZipEntryName = (name) => {
  const rawName = String(name ?? '');
  const slashName = rawName.replace(/\\/g, '/');
  const parts = slashName.split('/');

  return (
    !rawName.trim() ||
    rawName.includes('\0') ||
    slashName.startsWith('/') ||
    slashName.startsWith('//') ||
    /^[A-Za-z]:/.test(slashName) ||
    parts.some(
      (part, index) =>
        part === '.' ||
        part === '..' ||
        (part === '' && index !== parts.length - 1),
    )
  );
};

const assertSafeZipEntryName = (name) => {
  if (isUnsafeZipEntryName(name)) {
    throw new Error(`El ZIP DGII RNC contiene una entrada insegura: ${name}.`);
  }
};

const getZipEntryBaseName = (name) => {
  const normalizedName = normalizeZipEntryName(name);
  return normalizedName.split('/').filter(Boolean).pop() ?? normalizedName;
};

const matchesExpectedEntryName = (entryName, expectedEntryName) => {
  const normalizedEntryName = normalizeZipEntryName(entryName).toLowerCase();
  const normalizedExpectedName =
    normalizeZipEntryName(expectedEntryName).toLowerCase();
  const expectedHasDirectory = normalizedExpectedName.includes('/');

  return (
    normalizedEntryName === normalizedExpectedName ||
    (!expectedHasDirectory &&
      getZipEntryBaseName(entryName).toLowerCase() === normalizedExpectedName)
  );
};

const isZipDirectoryEntry = ({ externalAttributes, name, versionMadeBy }) => {
  const normalizedName = normalizeZipEntryName(name);
  if (normalizedName.endsWith('/')) return true;

  const platform = versionMadeBy >> 8;
  if (platform === ZIP_UNIX_PLATFORM) {
    const unixType = (externalAttributes >>> 16) & ZIP_UNIX_FILE_TYPE_MASK;
    return unixType === ZIP_UNIX_DIRECTORY;
  }

  return (externalAttributes & 0x10) === 0x10;
};

const assertSupportedZipFileType = ({
  externalAttributes,
  name,
  versionMadeBy,
}) => {
  const platform = versionMadeBy >> 8;
  if (platform !== ZIP_UNIX_PLATFORM) return;

  const unixType = (externalAttributes >>> 16) & ZIP_UNIX_FILE_TYPE_MASK;
  if (unixType === 0) return;

  if (unixType === ZIP_UNIX_SYMLINK) {
    throw new Error(
      `El ZIP DGII RNC contiene un enlace no permitido: ${name}.`,
    );
  }

  if (
    unixType !== ZIP_UNIX_REGULAR_FILE &&
    unixType !== ZIP_UNIX_DIRECTORY
  ) {
    throw new Error(
      `El ZIP DGII RNC contiene una entrada no regular no permitida: ${name}.`,
    );
  }
};

const isExpectedZipParentDirectory = (entryName, expectedEntryName) => {
  const normalizedEntryName = normalizeComparableZipEntryName(entryName);
  const normalizedExpectedName =
    normalizeComparableZipEntryName(expectedEntryName);
  if (!normalizedEntryName || !normalizedExpectedName.includes('/')) {
    return false;
  }

  const expectedParents = normalizedExpectedName.split('/').slice(0, -1);
  const entrySegments = normalizedEntryName.split('/');
  return (
    entrySegments.length <= expectedParents.length &&
    entrySegments.every((segment, index) => segment === expectedParents[index])
  );
};

const readZipUInt16 = (buffer, offset) => {
  if (offset < 0 || offset + 2 > buffer.length) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  return buffer.readUInt16LE(offset);
};

const readZipUInt32 = (buffer, offset) => {
  if (offset < 0 || offset + 4 > buffer.length) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  return buffer.readUInt32LE(offset);
};

const findZipEndOfCentralDirectoryOffset = (zipBuffer) => {
  const minimumOffset = Math.max(
    0,
    zipBuffer.length - ZIP_MAX_EOCD_SEARCH_BYTES,
  );
  for (
    let offset = zipBuffer.length - 22;
    offset >= minimumOffset;
    offset -= 1
  ) {
    if (readZipUInt32(zipBuffer, offset) === ZIP_EOCD_SIGNATURE) {
      return offset;
    }
  }

  throw new Error('DGII no devolvio un ZIP valido para RNC.');
};

const parseZipCentralDirectoryEntries = ({
  maxCentralDirectoryBytes,
  maxZipEntries,
  zipBuffer,
}) => {
  const eocdOffset = findZipEndOfCentralDirectoryOffset(zipBuffer);
  const diskNumber = readZipUInt16(zipBuffer, eocdOffset + 4);
  const centralDirectoryDisk = readZipUInt16(zipBuffer, eocdOffset + 6);
  const diskEntryCount = readZipUInt16(zipBuffer, eocdOffset + 8);
  const entryCount = readZipUInt16(zipBuffer, eocdOffset + 10);
  const centralDirectorySize = readZipUInt32(zipBuffer, eocdOffset + 12);
  const centralDirectoryOffset = readZipUInt32(zipBuffer, eocdOffset + 16);

  if (
    diskEntryCount === ZIP64_ENTRY_SENTINEL ||
    entryCount === ZIP64_ENTRY_SENTINEL ||
    centralDirectorySize === ZIP64_SENTINEL ||
    centralDirectoryOffset === ZIP64_SENTINEL
  ) {
    throw new Error('ZIP64 no esta soportado para snapshots RNC DGII.');
  }

  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    diskEntryCount !== entryCount
  ) {
    throw new Error('ZIP multidisco no esta soportado para snapshots RNC DGII.');
  }

  if (maxZipEntries && entryCount > maxZipEntries) {
    throw new Error(
      `ZIP DGII RNC contiene ${entryCount} entradas, limite ${maxZipEntries}.`,
    );
  }

  if (
    maxCentralDirectoryBytes &&
    centralDirectorySize > maxCentralDirectoryBytes
  ) {
    throw new Error(
      `Directorio central ZIP DGII RNC excede el maximo permitido: ${centralDirectorySize} bytes, limite ${maxCentralDirectoryBytes}.`,
    );
  }

  if (centralDirectoryOffset + centralDirectorySize > zipBuffer.length) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  const entries = [];
  let offset = centralDirectoryOffset;
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      offset + 46 > centralDirectoryEnd ||
      readZipUInt32(zipBuffer, offset) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE
    ) {
      throw new Error('DGII no devolvio un ZIP valido para RNC.');
    }

    const versionMadeBy = readZipUInt16(zipBuffer, offset + 4);
    const flags = readZipUInt16(zipBuffer, offset + 8);
    const compression = readZipUInt16(zipBuffer, offset + 10);
    const crc32 = readZipUInt32(zipBuffer, offset + 16);
    const compressedSize = readZipUInt32(zipBuffer, offset + 20);
    const uncompressedSize = readZipUInt32(zipBuffer, offset + 24);
    const fileNameLength = readZipUInt16(zipBuffer, offset + 28);
    const extraLength = readZipUInt16(zipBuffer, offset + 30);
    const commentLength = readZipUInt16(zipBuffer, offset + 32);
    const externalAttributes = readZipUInt32(zipBuffer, offset + 38);
    const localHeaderOffset = readZipUInt32(zipBuffer, offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;
    const nextOffset = nameEnd + extraLength + commentLength;

    if (nextOffset > centralDirectoryEnd) {
      throw new Error('DGII no devolvio un ZIP valido para RNC.');
    }

    if (
      compressedSize === ZIP64_SENTINEL ||
      uncompressedSize === ZIP64_SENTINEL ||
      localHeaderOffset === ZIP64_SENTINEL
    ) {
      throw new Error('ZIP64 no esta soportado para snapshots RNC DGII.');
    }

    entries.push({
      centralDirectoryOffset,
      compressedSize,
      compression,
      crc32,
      externalAttributes,
      flags,
      localHeaderOffset,
      name: zipBuffer.subarray(nameStart, nameEnd).toString('utf8'),
      uncompressedSize,
      versionMadeBy,
    });
    offset = nextOffset;
  }

  if (offset !== centralDirectoryEnd) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  return entries;
};

const assertZipEntryIsNotEncrypted = (entry) => {
  if ((entry.flags & ZIP_GENERAL_PURPOSE_ENCRYPTED) === 0) return;

  throw new Error(`El ZIP DGII RNC contiene una entrada cifrada: ${entry.name}.`);
};

const assertMatchingZipLocalHeaderValue = ({
  centralValue,
  entryName,
  fieldName,
  localValue,
}) => {
  if (centralValue === localValue) return;

  throw new Error(
    `Cabecera local ZIP DGII RNC no coincide con directorio central para ${entryName}: ${fieldName}.`,
  );
};

const validateZipLocalHeader = ({ entry, zipBuffer }) => {
  const offset = entry.localHeaderOffset;
  if (
    offset < 0 ||
    offset + 30 > zipBuffer.length ||
    readZipUInt32(zipBuffer, offset) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE
  ) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  const localFlags = readZipUInt16(zipBuffer, offset + 6);
  const localCompression = readZipUInt16(zipBuffer, offset + 8);
  const localCrc32 = readZipUInt32(zipBuffer, offset + 14);
  const localCompressedSize = readZipUInt32(zipBuffer, offset + 18);
  const localUncompressedSize = readZipUInt32(zipBuffer, offset + 22);
  const localFileNameLength = readZipUInt16(zipBuffer, offset + 26);
  const localExtraLength = readZipUInt16(zipBuffer, offset + 28);
  const localNameStart = offset + 30;
  const localNameEnd = localNameStart + localFileNameLength;
  const dataOffset = localNameEnd + localExtraLength;

  if (dataOffset > zipBuffer.length || dataOffset > entry.centralDirectoryOffset) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  const localName = zipBuffer.subarray(localNameStart, localNameEnd)
    .toString('utf8');

  if ((localFlags & ZIP_GENERAL_PURPOSE_ENCRYPTED) !== 0) {
    throw new Error(`El ZIP DGII RNC contiene una entrada cifrada: ${localName}.`);
  }

  assertMatchingZipLocalHeaderValue({
    centralValue: entry.name,
    entryName: entry.name,
    fieldName: 'nombre',
    localValue: localName,
  });
  assertMatchingZipLocalHeaderValue({
    centralValue: entry.flags,
    entryName: entry.name,
    fieldName: 'flags',
    localValue: localFlags,
  });
  assertMatchingZipLocalHeaderValue({
    centralValue: entry.compression,
    entryName: entry.name,
    fieldName: 'compression',
    localValue: localCompression,
  });

  if ((entry.flags & ZIP_GENERAL_PURPOSE_DATA_DESCRIPTOR) !== 0) {
    return;
  }

  assertMatchingZipLocalHeaderValue({
    centralValue: entry.crc32,
    entryName: entry.name,
    fieldName: 'crc32',
    localValue: localCrc32,
  });
  assertMatchingZipLocalHeaderValue({
    centralValue: entry.compressedSize,
    entryName: entry.name,
    fieldName: 'compressedSize',
    localValue: localCompressedSize,
  });
  assertMatchingZipLocalHeaderValue({
    centralValue: entry.uncompressedSize,
    entryName: entry.name,
    fieldName: 'uncompressedSize',
    localValue: localUncompressedSize,
  });

  if (dataOffset + entry.compressedSize > entry.centralDirectoryOffset) {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }
};

const validateDgiiZipEntries = ({
  expectedEntryName,
  maxCentralDirectoryBytes,
  maxTextBytes,
  maxZipEntries,
  zipBuffer,
}) => {
  const entries = parseZipCentralDirectoryEntries({
    maxCentralDirectoryBytes,
    maxZipEntries,
    zipBuffer,
  });
  const seenEntryNames = new Set();
  let expectedEntry = null;

  for (const entry of entries) {
    assertZipEntryIsNotEncrypted(entry);
    validateZipLocalHeader({ entry, zipBuffer });
    assertSafeZipEntryName(entry.name);
    assertSupportedZipFileType(entry);

    const comparableName = normalizeComparableZipEntryName(entry.name);
    if (seenEntryNames.has(comparableName)) {
      throw new Error(
        `El ZIP DGII RNC contiene una entrada duplicada: ${entry.name}.`,
      );
    }
    seenEntryNames.add(comparableName);

    const isDirectory = isZipDirectoryEntry(entry);
    const isExpectedFile =
      !isDirectory && matchesExpectedEntryName(entry.name, expectedEntryName);

    if (
      isDirectory &&
      isExpectedZipParentDirectory(entry.name, expectedEntryName)
    ) {
      continue;
    }

    if (!isExpectedFile) {
      throw new Error(
        `El ZIP DGII RNC contiene una entrada inesperada: ${entry.name}.`,
      );
    }

    if (expectedEntry) {
      throw new Error(
        `El ZIP de DGII contiene multiples entradas para ${expectedEntryName}.`,
      );
    }

    if (!/\.(txt|csv)$/i.test(entry.name)) {
      throw new Error(
        `La entrada esperada ${entry.name} no es TXT ni CSV de RNC.`,
      );
    }

    if (
      entry.compression !== ZIP_COMPRESSION_STORE &&
      entry.compression !== ZIP_COMPRESSION_DEFLATE
    ) {
      throw new Error(
        `El ZIP DGII RNC usa compresion no soportada para ${entry.name}.`,
      );
    }

    if (maxTextBytes && entry.uncompressedSize > maxTextBytes) {
      throw new Error(
        `TXT DGII RNC excede el maximo permitido: ${entry.uncompressedSize} bytes, limite ${maxTextBytes}.`,
      );
    }

    expectedEntry = entry;
  }

  if (!expectedEntry) {
    throw new Error(
      `El ZIP de DGII no contiene la entrada esperada ${expectedEntryName}.`,
    );
  }

  return expectedEntry;
};

const appendZipChunkWithLimit = ({
  chunk,
  chunks,
  maxZipBytes,
  totalBytes,
}) => {
  const buffer = Buffer.from(chunk);
  const nextTotalBytes = totalBytes + buffer.length;
  if (maxZipBytes && nextTotalBytes > maxZipBytes) {
    throw new Error(
      `ZIP DGII RNC excede el maximo permitido: ${nextTotalBytes} bytes, limite ${maxZipBytes}.`,
    );
  }

  chunks.push(buffer);
  return nextTotalBytes;
};

const readResponseBodyWithLimit = async ({ maxZipBytes, response }) => {
  if (response?.body?.getReader) {
    const chunks = [];
    let totalBytes = 0;
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes = appendZipChunkWithLimit({
          chunk: value,
          chunks,
          maxZipBytes,
          totalBytes,
        });
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally {
      reader.releaseLock();
    }

    return Buffer.concat(chunks, totalBytes);
  }

  if (response?.body?.[Symbol.asyncIterator]) {
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of response.body) {
      totalBytes = appendZipChunkWithLimit({
        chunk,
        chunks,
        maxZipBytes,
        totalBytes,
      });
    }

    return Buffer.concat(chunks, totalBytes);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (maxZipBytes && buffer.length > maxZipBytes) {
    throw new Error(
      `ZIP DGII RNC excede el maximo permitido: ${buffer.length} bytes, limite ${maxZipBytes}.`,
    );
  }

  return buffer;
};

const downloadDgiiZip = async ({
  fetchFn = fetch,
  maxZipBytes,
  sourceUrl,
  timeoutMs,
} = {}) => {
  const response = await fetchFn(sourceUrl, {
    headers: {
      accept: 'application/zip,application/octet-stream,*/*',
      referer: DEFAULT_REFERER,
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response?.ok) {
    throw new Error(
      `DGII respondio ${response?.status ?? 'sin estado'} al descargar RNC.`,
    );
  }

  const buffer = await readResponseBodyWithLimit({ maxZipBytes, response });

  if (buffer.length < 4 || buffer.subarray(0, 2).toString('utf8') !== 'PK') {
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  return buffer;
};

const extractDgiiTextFromZip = ({
  expectedEntryName,
  maxCentralDirectoryBytes,
  maxTextBytes,
  maxZipEntries,
  zipBuffer,
}) => {
  const expectedEntry = validateDgiiZipEntries({
    expectedEntryName,
    maxCentralDirectoryBytes,
    maxTextBytes,
    maxZipEntries,
    zipBuffer,
  });
  let extractionError = null;
  let uncompressedBytes = 0;
  const chunks = [];
  const setExtractionError = (error) => {
    extractionError = error;
  };

  try {
    const unzip = new Unzip((file) => {
      if (
        file.name !== expectedEntry.name ||
        file.originalSize !== expectedEntry.uncompressedSize
      ) {
        return;
      }

      file.ondata = (error, chunk) => {
        if (error) {
          setExtractionError(error);
          file.terminate();
          return;
        }

        uncompressedBytes += chunk.length;
        if (maxTextBytes && uncompressedBytes > maxTextBytes) {
          setExtractionError(
            new Error(
              `TXT DGII RNC excede el maximo permitido: ${uncompressedBytes} bytes, limite ${maxTextBytes}.`,
            ),
          );
          file.terminate();
          return;
        }

        chunks.push(Buffer.from(chunk));
      };
      file.start();
    });
    unzip.register(UnzipInflate);
    unzip.push(new Uint8Array(zipBuffer), true);
  } catch (_error) {
    if (extractionError?.message) throw extractionError;
    throw new Error('DGII no devolvio un ZIP valido para RNC.');
  }

  if (extractionError?.message) throw extractionError;

  const entryName = expectedEntry.name;

  if (!uncompressedBytes) {
    throw new Error(
      `La entrada ${entryName} del ZIP DGII esta vacia.`,
    );
  }

  if (!/\.(txt|csv)$/i.test(entryName)) {
    throw new Error(
      `La entrada esperada ${entryName} no es TXT ni CSV de RNC.`,
    );
  }

  const bytes = Buffer.concat(chunks, uncompressedBytes);
  const extractedCrc32 = calculateCrc32(bytes);
  if (extractedCrc32 !== expectedEntry.crc32) {
    throw new Error(
      `CRC32 TXT DGII RNC no coincide para ${entryName}: esperado ${formatZipUInt32(expectedEntry.crc32)}, recibido ${formatZipUInt32(extractedCrc32)}.`,
    );
  }

  const encoding = entryName.toLowerCase().endsWith('.txt')
    ? 'windows-1252'
    : 'utf-8';
  const text = new TextDecoder(encoding).decode(bytes);

  return {
    entryName,
    text,
    uncompressedBytes: bytes.length,
  };
};

function* iterateLines(text) {
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      yield text.slice(start, index).replace(/\r$/, '');
      start = index + 1;
    }
  }

  if (start < text.length) {
    yield text.slice(start).replace(/\r$/, '');
  }
}

const normalizeDgiiDate = (value) => {
  const cleaned = toCleanString(value);
  if (!cleaned) return null;

  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return cleaned;

  return `${match[3]}-${match[2]}-${match[1]}`;
};

const mapDgiiFieldsToRecord = (fields, sourceUpdatedAt) => {
  if (fields.length !== RNC_EXPECTED_FIELD_COUNT) {
    throw new Error(
      `Fila DGII RNC con ${fields.length} campos; se esperaban ${RNC_EXPECTED_FIELD_COUNT}.`,
    );
  }

  const rncNumber = normalizeRncNumber(fields[0]);
  return {
    rnc_number: rncNumber,
    full_name: toCleanString(fields[1]),
    business_name: toCleanString(fields[2]),
    business_activity: toCleanString(fields[3]),
    category: toCleanString(fields[4]),
    payment_regime: toCleanString(fields[5]),
    field_6: toCleanString(fields[6]),
    field_7: toCleanString(fields[7]),
    registration_date: normalizeDgiiDate(fields[8]),
    status: toCleanString(fields[9]),
    condition: toCleanString(fields[10]),
    raw_fields_json: JSON.stringify(fields.map((field) => field.trim())),
    source_updated_at: sourceUpdatedAt,
  };
};

const assertDgiiTextByteLimit = ({
  label,
  maxBytes,
  value,
}) => {
  if (!maxBytes) return;

  const byteLength = Buffer.byteLength(value, 'utf8');
  if (byteLength <= maxBytes) return;

  throw new Error(
    `${label} DGII RNC excede el maximo permitido: ${byteLength} bytes, limite ${maxBytes}.`,
  );
};

const splitDgiiFieldsWithLimits = ({ line, maxFieldBytes }) => {
  const fields = line.split('|');
  for (const field of fields) {
    assertDgiiTextByteLimit({
      label: 'Campo',
      maxBytes: maxFieldBytes,
      value: field,
    });
  }
  return fields;
};

export const buildRncSqliteFromDgiiText = ({
  dbPath,
  maxFieldBytes = DEFAULT_MAX_DGII_FIELD_BYTES,
  maxLineBytes = DEFAULT_MAX_DGII_LINE_BYTES,
  sourceUpdatedAt,
  text,
} = {}) => {
  const db = new DatabaseSync(dbPath);
  const fieldCountDistribution = {};
  const seenRncNumbers = new Set();
  let duplicateRncCount = 0;
  let nonEmptyLineCount = 0;
  let skippedRows = 0;
  let validSourceRows = 0;

  try {
    db.exec(RNC_TABLE_SCHEMA);
    db.exec(`PRAGMA user_version = ${RNC_SQLITE_USER_VERSION};`);
    const insert = db.prepare(`
      INSERT OR REPLACE INTO rnc (
        rnc_number,
        full_name,
        business_name,
        business_activity,
        category,
        payment_regime,
        field_6,
        field_7,
        registration_date,
        status,
        condition,
        raw_fields_json,
        source_updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN IMMEDIATE');
    for (const line of iterateLines(text)) {
      if (!line.trim()) continue;
      nonEmptyLineCount += 1;

      assertDgiiTextByteLimit({
        label: 'Linea',
        maxBytes: maxLineBytes,
        value: line,
      });
      const fields = splitDgiiFieldsWithLimits({
        line,
        maxFieldBytes,
      });
      const fieldCountKey = String(fields.length);
      fieldCountDistribution[fieldCountKey] =
        (fieldCountDistribution[fieldCountKey] ?? 0) + 1;
      try {
        const record = mapDgiiFieldsToRecord(fields, sourceUpdatedAt);
        if (seenRncNumbers.has(record.rnc_number)) {
          duplicateRncCount += 1;
        }
        seenRncNumbers.add(record.rnc_number);
        insert.run(
          record.rnc_number,
          record.full_name,
          record.business_name,
          record.business_activity,
          record.category,
          record.payment_regime,
          record.field_6,
          record.field_7,
          record.registration_date,
          record.status,
          record.condition,
          record.raw_fields_json,
          record.source_updated_at,
        );
        validSourceRows += 1;
      } catch (_error) {
        skippedRows += 1;
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch (_rollbackError) {
      // Ignore rollback errors after failed SQLite setup.
    }
    throw error;
  } finally {
    db.close();
  }

  if (validSourceRows === 0) {
    throw new Error('El archivo DGII no produjo filas RNC validas.');
  }

  return {
    duplicateRncCount,
    expectedFieldCount: RNC_EXPECTED_FIELD_COUNT,
    fieldCountDistribution,
    nonEmptyLineCount,
    parserVersion: RNC_PARSER_VERSION,
    rowCount: seenRncNumbers.size,
    skippedRows,
    validSourceRows,
  };
};

const gzipFile = async ({ sourcePath, targetPath }) => {
  await pipeline(
    createReadStream(sourcePath),
    createGzip({ level: 9, mtime: 0 }),
    createWriteStream(targetPath),
  );
};

const hashBuffer = (buffer) => createHash('sha256').update(buffer).digest('hex');
const hashString = (value) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const hashFile = async (filePath) => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
};

const assertNoPendingSqliteFiles = async (dbPath) => {
  const pendingSuffixes = ['-journal', '-wal', '-shm'];
  const existing = [];

  for (const suffix of pendingSuffixes) {
    try {
      await stat(`${dbPath}${suffix}`);
      existing.push(`${dbPath}${suffix}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  if (existing.length) {
    throw new Error(
      `SQLite RNC tiene archivos pendientes antes de publicar: ${existing.join(', ')}.`,
    );
  }
};

const validateGeneratedSnapshot = ({
  dbPath,
  maxNullConditionRows,
  maxNullFullNameRows,
  maxNullStatusRows,
  minRowCount,
  validationRncNumbers,
  validationRncRecords,
} = {}) => {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    db.exec('PRAGMA query_only = ON;');
    const userVersion = Number(
      db.prepare('PRAGMA user_version').get()?.user_version ?? 0,
    );
    if (userVersion !== RNC_SQLITE_USER_VERSION) {
      throw new Error(
        `SQLite RNC tiene user_version incompatible: ${userVersion}.`,
      );
    }

    const quickCheckRows = db.prepare('PRAGMA quick_check').all();
    const quickCheckMessages = quickCheckRows
      .map((row) => row.quick_check ?? Object.values(row)[0])
      .map((message) => String(message ?? '').trim())
      .filter(Boolean);
    if (
      quickCheckMessages.length !== 1 ||
      quickCheckMessages[0].toLowerCase() !== 'ok'
    ) {
      throw new Error(
        `PRAGMA quick_check fallo: ${quickCheckMessages.join('; ')}`,
      );
    }

    const rowCount = Number(
      db.prepare('SELECT COUNT(*) AS rowCount FROM rnc').get()?.rowCount ?? 0,
    );
    if (rowCount < minRowCount) {
      throw new Error(
        `Snapshot RNC invalido: ${rowCount} filas, minimo esperado ${minRowCount}.`,
      );
    }

    const qualityMetrics = {
      nullConditionRows: Number(
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM rnc WHERE condition IS NULL OR TRIM(condition) = ''",
          )
          .get()?.count ?? 0,
      ),
      nullFullNameRows: Number(
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM rnc WHERE full_name IS NULL OR TRIM(full_name) = ''",
          )
          .get()?.count ?? 0,
      ),
      nullStatusRows: Number(
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM rnc WHERE status IS NULL OR TRIM(status) = ''",
          )
          .get()?.count ?? 0,
      ),
    };

    const qualityFailures = [
      {
        key: 'full_name',
        limit: maxNullFullNameRows,
        value: qualityMetrics.nullFullNameRows,
      },
      {
        key: 'status',
        limit: maxNullStatusRows,
        value: qualityMetrics.nullStatusRows,
      },
      {
        key: 'condition',
        limit: maxNullConditionRows,
        value: qualityMetrics.nullConditionRows,
      },
    ].filter((item) => item.value > item.limit);
    if (qualityFailures.length) {
      throw new Error(
        `Snapshot RNC invalido por campos nulos: ${qualityFailures
          .map((item) => `${item.key}=${item.value} limite=${item.limit}`)
          .join(', ')}.`,
      );
    }

    const lookup = db.prepare(
      'SELECT rnc_number FROM rnc WHERE rnc_number = ? LIMIT 1',
    );
    const knownLookups = validationRncNumbers.map((rncNumber) => {
      const rnc = normalizeRncNumber(rncNumber);
      return {
        found: Boolean(lookup.get(rnc)),
        rnc,
      };
    });
    const missing = knownLookups.filter((item) => !item.found);
    if (missing.length) {
      throw new Error(
        `Snapshot RNC no contiene RNC de validacion: ${missing
          .map((item) => item.rnc)
          .join(', ')}.`,
      );
    }

    const recordLookup = db.prepare(
      'SELECT rnc_number, full_name, status, condition FROM rnc WHERE rnc_number = ? LIMIT 1',
    );
    const expectedRecordChecks = validationRncRecords.map((expectedRecord) => {
      const actualRecord = recordLookup.get(expectedRecord.rnc) ?? null;
      const mismatches = Object.entries(expectedRecord)
        .filter(([key]) => key !== 'rnc')
        .filter(
          ([key, expectedValue]) =>
            toCleanString(actualRecord?.[key]) !== expectedValue,
        )
        .map(([key, expectedValue]) => ({
          actual: toCleanString(actualRecord?.[key]),
          expected: expectedValue,
          key,
        }));

      return {
        found: Boolean(actualRecord),
        mismatches,
        rnc: expectedRecord.rnc,
      };
    });
    const invalidExpectedRecords = expectedRecordChecks.filter(
      (item) => !item.found || item.mismatches.length,
    );
    if (invalidExpectedRecords.length) {
      throw new Error(
        `Snapshot RNC no coincide con registros canario: ${invalidExpectedRecords
          .map((item) => item.rnc)
          .join(', ')}.`,
      );
    }

    return {
      expectedRecordChecks,
      knownLookups,
      minimumRowCount: minRowCount,
      qualityMetrics,
      quickCheck: 'ok',
      rowCount,
      validationRncRecords,
      validationRncNumbers,
    };
  } finally {
    db.close();
  }
};

const getDuplicateRncMetrics = ({
  duplicateRncCount,
  validSourceRows,
} = {}) => {
  const duplicateCount = Number(duplicateRncCount);
  const sourceRows = Number(validSourceRows);

  if (
    !Number.isInteger(duplicateCount) ||
    duplicateCount < 0 ||
    !Number.isInteger(sourceRows) ||
    sourceRows <= 0
  ) {
    return null;
  }

  return {
    duplicateRncCount: duplicateCount,
    duplicateRncRatio: duplicateCount / sourceRows,
    validSourceRows: sourceRows,
  };
};

const formatRatioAsPercent = (ratio) => (ratio * 100).toFixed(2);

const hasDuplicateRncMetrics = (manifest) =>
  manifest?.duplicateRncCount != null || manifest?.validSourceRows != null;

const isDuplicateRncWithinStaticLimits = ({ config, metrics }) =>
  Boolean(metrics) &&
  (config.maxDuplicateRncCount == null ||
    metrics.duplicateRncCount <= config.maxDuplicateRncCount) &&
  metrics.duplicateRncRatio <= config.maxDuplicateRncRatio;

const validateBuildMetrics = ({ buildResult, config }) => {
  if (buildResult.skippedRows > config.maxSkippedRows) {
    throw new Error(
      `Snapshot RNC invalido: ${buildResult.skippedRows} filas omitidas, maximo ${config.maxSkippedRows}.`,
    );
  }

  const duplicateMetrics = getDuplicateRncMetrics(buildResult);
  if (!duplicateMetrics) {
    throw new Error(
      'Snapshot RNC invalido: metricas de duplicados RNC incompletas.',
    );
  }

  if (
    config.maxDuplicateRncCount != null &&
    duplicateMetrics.duplicateRncCount > config.maxDuplicateRncCount
  ) {
    throw new Error(
      `Snapshot RNC invalido: duplicateRncCount ${duplicateMetrics.duplicateRncCount}, maximo ${config.maxDuplicateRncCount}.`,
    );
  }

  if (duplicateMetrics.duplicateRncRatio > config.maxDuplicateRncRatio) {
    throw new Error(
      `Snapshot RNC invalido: duplicateRncCount ${duplicateMetrics.duplicateRncCount} equivale a ${formatRatioAsPercent(
        duplicateMetrics.duplicateRncRatio,
      )}% de validSourceRows; maximo ${formatRatioAsPercent(config.maxDuplicateRncRatio)}%.`,
    );
  }

  return {
    duplicateRncRatio: duplicateMetrics.duplicateRncRatio,
  };
};

const compareWithPreviousManifest = ({
  config,
  duplicateRncCount,
  previousManifest,
  rowCount,
  validSourceRows,
}) => {
  const previousRowCount = Number(previousManifest?.rowCount ?? 0);
  const comparison = {
    duplicateRncRatioIncrease: null,
    maxDuplicateRncRatioIncrease: config.maxDuplicateRncRatioIncrease,
    maxRowCountIncreaseRatio: config.maxRowCountIncreaseRatio,
    maxRowCountDropRatio: config.maxRowCountDropRatio,
    previousDuplicateRncCount: null,
    previousDuplicateRncRatio: null,
    previousRowCount: null,
    previousValidSourceRows: null,
    rowCountIncreaseRatio: null,
    rowCountDropRatio: null,
  };

  if (previousRowCount) {
    const rowCountDropRatio = Math.max(
      0,
      (previousRowCount - rowCount) / previousRowCount,
    );
    const rowCountIncreaseRatio = Math.max(
      0,
      (rowCount - previousRowCount) / previousRowCount,
    );
    if (rowCountDropRatio > config.maxRowCountDropRatio) {
      throw new Error(
        `Snapshot RNC invalido: rowCount bajo ${formatRatioAsPercent(
          rowCountDropRatio,
        )}% contra snapshot anterior; maximo ${formatRatioAsPercent(config.maxRowCountDropRatio)}%.`,
      );
    }

    if (rowCountIncreaseRatio > config.maxRowCountIncreaseRatio) {
      throw new Error(
        `Snapshot RNC invalido: rowCount subio ${formatRatioAsPercent(
          rowCountIncreaseRatio,
        )}% contra snapshot anterior; maximo ${formatRatioAsPercent(config.maxRowCountIncreaseRatio)}%.`,
      );
    }

    comparison.previousRowCount = previousRowCount;
    comparison.rowCountIncreaseRatio = rowCountIncreaseRatio;
    comparison.rowCountDropRatio = rowCountDropRatio;
  }

  const currentDuplicateMetrics = getDuplicateRncMetrics({
    duplicateRncCount,
    validSourceRows,
  });
  const previousDuplicateMetrics = getDuplicateRncMetrics(previousManifest);

  if (currentDuplicateMetrics && previousDuplicateMetrics) {
    const duplicateRncRatioIncrease = Math.max(
      0,
      currentDuplicateMetrics.duplicateRncRatio -
        previousDuplicateMetrics.duplicateRncRatio,
    );
    if (
      duplicateRncRatioIncrease > config.maxDuplicateRncRatioIncrease
    ) {
      throw new Error(
        `Snapshot RNC invalido: duplicateRncCount subio ${formatRatioAsPercent(
          duplicateRncRatioIncrease,
        )} puntos contra snapshot anterior; maximo ${formatRatioAsPercent(config.maxDuplicateRncRatioIncrease)}.`,
      );
    }

    comparison.duplicateRncRatioIncrease = duplicateRncRatioIncrease;
    comparison.previousDuplicateRncCount =
      previousDuplicateMetrics.duplicateRncCount;
    comparison.previousDuplicateRncRatio =
      previousDuplicateMetrics.duplicateRncRatio;
    comparison.previousValidSourceRows = previousDuplicateMetrics.validSourceRows;
  }

  return comparison;
};

const toCustomMetadataValue = (value) => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getBucket = (bucketName) =>
  bucketName ? storage.bucket(bucketName) : storage.bucket();

const readCurrentManifest = async ({ bucket, currentManifestPath }) => {
  const file = bucket.file(currentManifestPath);
  let currentFileRead = false;
  try {
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    currentFileRead = true;
    const current = parseRncCurrentManifest(buffer);
    if (current?.manifestPath) {
      const manifestFile = bucket.file(current.manifestPath);
      const [manifestMetadata] = await manifestFile.getMetadata();
      const [manifestBuffer] = await manifestFile.download();
      const snapshotManifest = parseRncSnapshotManifest(manifestBuffer);

      return {
        current,
        generation: metadata?.generation || null,
        manifest: {
          ...snapshotManifest,
          manifestGeneration: manifestMetadata?.generation || null,
          manifestPath: current.manifestPath,
          manifestUpdated: manifestMetadata?.updated || null,
        },
        updated: metadata?.updated || null,
      };
    }

    return {
      current,
      generation: metadata?.generation || null,
      manifest: current,
      updated: metadata?.updated || null,
    };
  } catch (error) {
    if (!currentFileRead && error?.code === 404) return null;
    throw error;
  }
};

const getManifestHash = (manifest, key) => {
  const value =
    manifest?.[key] ??
    (key === 'sourceZipSha256' ? manifest?.source?.zipSha256 : null) ??
    (key === 'sourceTextSha256' ? manifest?.source?.textSha256 : null);
  return typeof value === 'string' && value.length > 0
    ? value.toLowerCase()
    : null;
};

const getComparableRncList = (values) =>
  (Array.isArray(values) ? values : [])
    .map((value) => normalizeRncNumber(value))
    .sort();

const hasSameRncList = (left, right) => {
  const normalizedLeft = getComparableRncList(left);
  const normalizedRight = getComparableRncList(right);
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
};

const getComparableValidationRecords = (values) =>
  (Array.isArray(values) ? values : [])
    .map((record) => normalizeValidationRecord(record))
    .sort((left, right) => left.rnc.localeCompare(right.rnc));

const hasSameValidationRecords = (left, right) => {
  const normalizedLeft = getComparableValidationRecords(left);
  const normalizedRight = getComparableValidationRecords(right);
  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
};

const getManifestValidationRncNumbers = (manifest) => {
  if (Array.isArray(manifest?.validation?.validationRncNumbers)) {
    return manifest.validation.validationRncNumbers;
  }

  if (Array.isArray(manifest?.validationRncNumbers)) {
    return manifest.validationRncNumbers;
  }

  if (Array.isArray(manifest?.validation?.knownLookups)) {
    return manifest.validation.knownLookups.map((item) => item.rnc);
  }

  return [];
};

const getManifestValidationRncRecords = (manifest) => {
  if (Array.isArray(manifest?.validation?.validationRncRecords)) {
    return manifest.validation.validationRncRecords;
  }

  if (Array.isArray(manifest?.validationRncRecords)) {
    return manifest.validationRncRecords;
  }

  return [];
};

const canReuseCurrentManifest = ({ config, currentManifest }) => {
  if (!currentManifest || currentManifest.validation?.quickCheck !== 'ok') {
    return false;
  }

  if (currentManifest.parserVersion !== RNC_PARSER_VERSION) {
    return false;
  }

  if (
    !matchesExpectedEntryName(
      currentManifest.entryName ?? currentManifest.source?.entryName,
      config.expectedEntryName,
    )
  ) {
    return false;
  }

  const manifestMinimumRowCount = Number(
    currentManifest.validation?.minimumRowCount ??
      currentManifest.minimumRowCount ??
      0,
  );
  if (manifestMinimumRowCount !== config.minRowCount) {
    return false;
  }

  const manifestRowCount = Number(
    currentManifest.validation?.rowCount ?? currentManifest.rowCount ?? 0,
  );
  if (manifestRowCount < config.minRowCount) {
    return false;
  }

  if (
    hasDuplicateRncMetrics(currentManifest) &&
    !isDuplicateRncWithinStaticLimits({
      config,
      metrics: getDuplicateRncMetrics(currentManifest),
    })
  ) {
    return false;
  }

  try {
    return hasSameRncList(
      getManifestValidationRncNumbers(currentManifest),
      config.validationRncNumbers,
    ) && hasSameValidationRecords(
      getManifestValidationRncRecords(currentManifest),
      config.validationRncRecords,
    );
  } catch (_error) {
    return false;
  }
};

const getUnchangedSourceSkipReason = ({
  currentManifest,
  sourceTextSha256,
  sourceZipSha256,
}) => {
  if (!currentManifest) return null;

  if (
    sourceZipSha256 &&
    getManifestHash(currentManifest, 'sourceZipSha256') === sourceZipSha256
  ) {
    return 'source-zip-unchanged';
  }

  if (
    sourceTextSha256 &&
    getManifestHash(currentManifest, 'sourceTextSha256') === sourceTextSha256
  ) {
    return 'source-text-unchanged';
  }

  return null;
};

const createSkippedRefreshResult = ({
  bucket,
  checkedAt,
  config,
  extra = {},
  previousCurrent,
  skipReason,
  sourceTextSha256,
  sourceZipSha256,
  trigger,
}) => {
  const currentManifest = previousCurrent?.manifest ?? null;
  return {
    ok: true,
    skipped: true,
    skipReason,
    bucketName: bucket.name,
    checkedAt,
    currentGeneratedAt: currentManifest?.generatedAt ?? null,
    currentManifestPath: config.currentManifestPath,
    rowCount: currentManifest?.rowCount,
    skippedRows: currentManifest?.skippedRows,
    sourceTextSha256,
    sourceUrl: config.sourceUrl,
    sourceZipSha256,
    storagePath: currentManifest?.snapshotPath ?? null,
    trigger,
    ...extra,
  };
};

const isFutureIsoDate = (value, nowIso) =>
  typeof value === 'string' &&
  Number.isFinite(Date.parse(value)) &&
  Date.parse(value) > Date.parse(nowIso);

const getRollbackHoldUntil = ({ config, previousCurrent, nowIso }) => {
  const pointer = previousCurrent?.current ?? {};
  const holdUntil = config.rollbackHoldUntil ?? pointer.rollbackHoldUntil ?? null;

  if (
    !config.ignoreRollbackHold &&
    (config.rollbackHoldUntil || pointer.activationReason === 'rollback') &&
    isFutureIsoDate(holdUntil, nowIso)
  ) {
    return holdUntil;
  }

  return null;
};

const getRejectedSha256List = ({ config, previousCurrent }) => {
  const pointer = previousCurrent?.current ?? {};
  const pointerRejectedSha256List = Array.isArray(pointer.rejectedSha256List)
    ? pointer.rejectedSha256List
    : [];

  return [
    ...new Set([
      ...config.rejectedSha256List,
      ...pointerRejectedSha256List,
    ]),
  ];
};

const logSkippedRefresh = (result) => {
  logger.info('[refreshRncSnapshot] skipped unchanged source', {
    currentGeneratedAt: result.currentGeneratedAt,
    rowCount: result.rowCount,
    skipReason: result.skipReason,
    storagePath: result.storagePath,
    trigger: result.trigger,
  });
};

const saveJsonObject = async ({
  bucket,
  body,
  cacheControl,
  contentType = 'application/json',
  path: objectPath,
  preconditionGeneration,
}) => {
  const options = {
    contentType,
    resumable: false,
    metadata: {
      cacheControl,
    },
  };

  if (preconditionGeneration !== undefined) {
    options.preconditionOpts = {
      ifGenerationMatch: preconditionGeneration,
    };
  }

  await bucket.file(objectPath).save(JSON.stringify(body, null, 2), options);
};

const isPreconditionFailedError = (error) =>
  error?.code === 412 ||
  error?.errors?.some((item) => item?.reason === 'conditionNotMet');

const stableJsonStringify = (value) => {
  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
    .join(',')}}`;
};

const assertExistingSnapshotMatches = async ({
  file,
  gzipBuffer,
  snapshotMetadata,
}) => {
  const [existingBuffer] = await file.download();
  const existingSha256 = hashBuffer(existingBuffer);

  if (
    existingSha256 !== snapshotMetadata.sha256 ||
    existingBuffer.length !== snapshotMetadata.sqliteGzipBytes ||
    !existingBuffer.equals(gzipBuffer)
  ) {
    throw new Error(
      'Snapshot RNC existente no coincide con el contenido generado.',
    );
  }
};

const assertExistingManifestMatches = async ({
  bucket,
  expectedManifest,
  manifestPath,
}) => {
  const [existingBuffer] = await bucket.file(manifestPath).download();
  const existingManifest = parseRncSnapshotManifest(existingBuffer);

  const fieldsToCompare = [
    'duplicateRncCount',
    'duplicateRncRatio',
    'entryName',
    'expectedEntryName',
    'expectedFieldCount',
    'fieldCountDistribution',
    'legacyStoragePath',
    'maxDuplicateRncCount',
    'maxDuplicateRncRatio',
    'maxDuplicateRncRatioIncrease',
    'maxSkippedRows',
    'minimumRowCount',
    'nonEmptyLineCount',
    'parserVersion',
    'previousComparison',
    'rowCount',
    'sha256',
    'snapshotGzipSha256',
    'snapshotPath',
    'skippedRows',
    'source',
    'sourceTextSha256',
    'sourceUrl',
    'sourceZipSha256',
    'sqliteBytes',
    'sqliteGzipSha256',
    'sqliteGzipBytes',
    'sqliteSha256',
    'uncompressedBytes',
    'validation',
    'validationRncNumbers',
    'validationRncRecords',
    'validSourceRows',
    'zipBytes',
  ];
  const mismatch = fieldsToCompare.some(
    (field) =>
      stableJsonStringify(existingManifest[field]) !==
      stableJsonStringify(expectedManifest[field]),
  );

  if (mismatch) {
    throw new Error('Manifest RNC existente no coincide con el generado.');
  }
};

const assertCurrentPointerAlreadyActivated = async ({
  bucket,
  currentManifestPath,
  expectedPointer,
}) => {
  const [existingBuffer] = await bucket.file(currentManifestPath).download();
  const existingPointer = parseRncCurrentManifest(existingBuffer);

  if (
    existingPointer.manifestPath !== expectedPointer.manifestPath ||
    existingPointer.sha256 !== expectedPointer.sha256
  ) {
    throw new Error(
      'current.json cambio durante la publicacion del snapshot RNC.',
    );
  }
};

const uploadSnapshot = async ({
  bucket,
  currentManifestPath,
  gzipPath,
  manifestPath,
  metadata,
  previousCurrent,
  snapshotPath,
} = {}) => {
  const file = bucket.file(snapshotPath);
  const gzipBuffer = await readFile(gzipPath);
  const sqliteGzipBytes = gzipBuffer.length;
  const snapshotMetadata = {
    ...metadata,
    snapshotPath,
    sqliteGzipBytes,
  };

  try {
    await file.save(gzipBuffer, {
      contentType: 'application/gzip',
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=31536000, immutable',
        metadata: Object.fromEntries(
          Object.entries(snapshotMetadata).map(([key, value]) => [
            key,
            toCustomMetadataValue(value),
          ]),
        ),
      },
      preconditionOpts: {
        ifGenerationMatch: 0,
      },
    });
  } catch (error) {
    if (!isPreconditionFailedError(error)) throw error;
    await assertExistingSnapshotMatches({
      file,
      gzipBuffer,
      snapshotMetadata,
    });
  }

  const [storageObjectMetadata] = await file.getMetadata();
  const manifest = {
    schemaVersion: RNC_SNAPSHOT_MANIFEST_SCHEMA_VERSION,
    ...snapshotMetadata,
    generation: storageObjectMetadata?.generation || null,
    manifestPath,
    manifestCreatedAt:
      metadata.manifestCreatedAt ?? metadata.generatedAt ?? new Date().toISOString(),
    snapshotGzipSha256: snapshotMetadata.sha256,
    updated: storageObjectMetadata?.updated || null,
  };
  parseRncSnapshotManifest(JSON.stringify(manifest));

  await saveJsonObject({
    body: manifest,
    bucket,
    cacheControl: 'private, max-age=31536000, immutable',
    path: manifestPath,
    preconditionGeneration: 0,
  }).catch((error) => {
    if (!isPreconditionFailedError(error)) throw error;
    return assertExistingManifestMatches({
      bucket,
      expectedManifest: manifest,
      manifestPath,
    });
  });

  const currentPointer = {
    activatedAt:
      metadata.activatedAt ?? metadata.generatedAt ?? new Date().toISOString(),
    activationReason: 'publish',
    schemaVersion: RNC_SNAPSHOT_MANIFEST_SCHEMA_VERSION,
    manifestPath,
    rejectedSha256List: [],
    sha256: manifest.sha256,
    snapshotGzipSha256: manifest.snapshotGzipSha256,
  };
  parseRncCurrentManifest(JSON.stringify(currentPointer));

  await saveJsonObject({
    body: currentPointer,
    bucket,
    cacheControl: 'private, max-age=60',
    path: currentManifestPath,
    preconditionGeneration: previousCurrent?.generation ?? 0,
  }).catch((error) => {
    if (!isPreconditionFailedError(error)) throw error;
    return assertCurrentPointerAlreadyActivated({
      bucket,
      currentManifestPath,
      expectedPointer: currentPointer,
    });
  });

  return {
    bucketName: bucket.name,
    currentManifestPath,
    manifest,
    manifestPath,
    storagePath: snapshotPath,
    sqliteGzipBytes,
  };
};

export const refreshRncSnapshot = async ({
  env = process.env,
  fetchFn = fetch,
  now = () => new Date(),
  trigger = 'manual',
} = {}) => {
  const config = resolveRefreshConfig({ env });
  const generatedAt = now().toISOString();
  const workDir = await createWorkDir();
  const dbPath = path.join(workDir, 'rnc.sqlite');
  const gzipPath = `${dbPath}.gz`;

  logger.info('[refreshRncSnapshot] starting', {
    sourceUrl: config.sourceUrl,
    currentManifestPath: config.currentManifestPath,
    trigger,
  });

  try {
    const bucket = getBucket(config.bucketName);
    const previousCurrent = await readCurrentManifest({
      bucket,
      currentManifestPath: config.currentManifestPath,
    });
    const rollbackHoldUntil = getRollbackHoldUntil({
      config,
      nowIso: generatedAt,
      previousCurrent,
    });
    if (rollbackHoldUntil) {
      const result = createSkippedRefreshResult({
        bucket,
        checkedAt: generatedAt,
        config,
        extra: {
          rollbackHoldUntil,
        },
        previousCurrent,
        skipReason: 'rollback-hold-active',
        trigger,
      });
      logger.warn('[refreshRncSnapshot] skipped because rollback hold is active', {
        rollbackHoldUntil,
        trigger,
      });

      return result;
    }

    const zipBuffer = await downloadDgiiZip({
      fetchFn,
      maxZipBytes: config.maxZipBytes,
      sourceUrl: config.sourceUrl,
      timeoutMs: config.downloadTimeoutMs,
    });
    const sourceZipSha256 = hashBuffer(zipBuffer);
    const currentUsesVersionedManifest = Boolean(
      previousCurrent?.current?.manifestPath,
    );
    const reusableCurrentManifest = canReuseCurrentManifest({
      config,
      currentManifest: previousCurrent?.manifest,
    });
    const zipSkipReason =
      config.skipUnchangedZip &&
      currentUsesVersionedManifest &&
      reusableCurrentManifest
      ? getUnchangedSourceSkipReason({
          currentManifest: previousCurrent?.manifest,
          sourceZipSha256,
        })
      : null;

    if (zipSkipReason) {
      const result = createSkippedRefreshResult({
        bucket,
        checkedAt: generatedAt,
        config,
        previousCurrent,
        skipReason: zipSkipReason,
        sourceZipSha256,
        trigger,
      });
      logSkippedRefresh(result);

      return result;
    }

    const { entryName, text, uncompressedBytes } =
      extractDgiiTextFromZip({
        expectedEntryName: config.expectedEntryName,
        maxCentralDirectoryBytes: config.maxZipCentralDirectoryBytes,
        maxTextBytes: config.maxTextBytes,
        maxZipEntries: config.maxZipEntries,
        zipBuffer,
      });
    const sourceTextSha256 = hashString(text);
    const textSkipReason =
      config.skipUnchangedZip &&
      currentUsesVersionedManifest &&
      reusableCurrentManifest
      ? getUnchangedSourceSkipReason({
          currentManifest: previousCurrent?.manifest,
          sourceTextSha256,
          sourceZipSha256,
        })
      : null;

    if (textSkipReason) {
      const result = createSkippedRefreshResult({
        bucket,
        checkedAt: generatedAt,
        config,
        previousCurrent,
        skipReason: textSkipReason,
        sourceTextSha256,
        sourceZipSha256,
        trigger,
      });
      logSkippedRefresh(result);

      return result;
    }

    const buildResult = buildRncSqliteFromDgiiText({
      dbPath,
      maxFieldBytes: config.maxDgiiFieldBytes,
      maxLineBytes: config.maxDgiiLineBytes,
      sourceUpdatedAt: null,
      text,
    });
    const buildQuality = validateBuildMetrics({ buildResult, config });
    const validation = validateGeneratedSnapshot({
      dbPath,
      maxNullConditionRows: config.maxNullConditionRows,
      maxNullFullNameRows: config.maxNullFullNameRows,
      maxNullStatusRows: config.maxNullStatusRows,
      minRowCount: config.minRowCount,
      validationRncNumbers: config.validationRncNumbers,
      validationRncRecords: config.validationRncRecords,
    });
    const previousComparison = compareWithPreviousManifest({
      config,
      duplicateRncCount: buildResult.duplicateRncCount,
      previousManifest: previousCurrent?.manifest,
      rowCount: validation.rowCount,
      validSourceRows: buildResult.validSourceRows,
    });
    await assertNoPendingSqliteFiles(dbPath);
    await gzipFile({ sourcePath: dbPath, targetPath: gzipPath });

    const dbStats = await stat(dbPath);
    if (dbStats.size > config.maxSqliteBytes) {
      throw new Error(
        `SQLite RNC excede el maximo permitido: ${dbStats.size} bytes, limite ${config.maxSqliteBytes}.`,
      );
    }

    const sqliteSha256 = await hashFile(dbPath);
    const gzipSha256 = await hashFile(gzipPath);
    const rejectedSha256List = getRejectedSha256List({
      config,
      previousCurrent,
    });
    if (rejectedSha256List.includes(gzipSha256)) {
      const result = createSkippedRefreshResult({
        bucket,
        checkedAt: generatedAt,
        config,
        extra: {
          rejectedSha256: gzipSha256,
        },
        previousCurrent,
        skipReason: 'snapshot-sha256-rejected',
        sourceTextSha256,
        sourceZipSha256,
        trigger,
      });
      logger.warn('[refreshRncSnapshot] skipped rejected snapshot hash', {
        rejectedSha256: gzipSha256,
        trigger,
      });

      return result;
    }

    const snapshotPath = buildVersionedRncSnapshotPath({
      sha256: gzipSha256,
      snapshotPrefix: config.snapshotPrefix,
    });
    const manifestPath = buildVersionedRncManifestPath({
      manifestPrefix: config.manifestPrefix,
      sha256: gzipSha256,
    });
    if (
      config.skipUnchangedZip &&
      reusableCurrentManifest &&
      previousCurrent?.manifest?.sha256 === gzipSha256
    ) {
      const result = createSkippedRefreshResult({
        bucket,
        checkedAt: generatedAt,
        config,
        previousCurrent,
        skipReason: 'snapshot-unchanged',
        sourceTextSha256,
        sourceZipSha256,
        trigger,
      });
      logSkippedRefresh(result);

      return {
        ...result,
        sha256: gzipSha256,
        snapshotGzipSha256: gzipSha256,
        sqliteGzipSha256: gzipSha256,
        sqliteBytes: dbStats.size,
        sqliteSha256,
      };
    }

    const metadata = {
      duplicateRncCount: buildResult.duplicateRncCount,
      duplicateRncRatio: buildQuality.duplicateRncRatio,
      entryName,
      expectedEntryName: config.expectedEntryName,
      expectedFieldCount: RNC_EXPECTED_FIELD_COUNT,
      fieldCountDistribution: buildResult.fieldCountDistribution,
      generatedAt,
      legacyStoragePath: config.legacyStoragePath,
      ...(config.maxDuplicateRncCount == null
        ? {}
        : { maxDuplicateRncCount: config.maxDuplicateRncCount }),
      maxDuplicateRncRatio: config.maxDuplicateRncRatio,
      maxDuplicateRncRatioIncrease: config.maxDuplicateRncRatioIncrease,
      maxSkippedRows: config.maxSkippedRows,
      minimumRowCount: config.minRowCount,
      nonEmptyLineCount: buildResult.nonEmptyLineCount,
      parserVersion: RNC_PARSER_VERSION,
      previousComparison,
      rowCount: validation.rowCount,
      sha256: gzipSha256,
      snapshotGzipSha256: gzipSha256,
      skippedRows: buildResult.skippedRows,
      source: {
        entryName,
        textSha256: sourceTextSha256,
        type: 'dgii-rnc-zip',
        uncompressedBytes,
        url: config.sourceUrl,
        zipBytes: zipBuffer.length,
        zipSha256: sourceZipSha256,
      },
      sourceTextSha256,
      sourceUrl: config.sourceUrl,
      sourceZipSha256,
      sqliteGzipSha256: gzipSha256,
      sqliteSha256,
      trigger,
      validation,
      validationRncNumbers: config.validationRncNumbers,
      validationRncRecords: config.validationRncRecords,
      validSourceRows: buildResult.validSourceRows,
      uncompressedBytes,
      zipBytes: zipBuffer.length,
      sqliteBytes: dbStats.size,
    };
    const upload = await uploadSnapshot({
      bucket,
      currentManifestPath: config.currentManifestPath,
      gzipPath,
      manifestPath,
      metadata,
      previousCurrent,
      snapshotPath,
    });

    const result = {
      ok: true,
      ...metadata,
      ...upload,
      currentPath: upload.currentManifestPath,
      metadataPath: upload.manifestPath,
      snapshotPath: upload.storagePath,
    };

    logger.info('[refreshRncSnapshot] completed', {
      rowCount: result.rowCount,
      sha256: result.sha256,
      skippedRows: result.skippedRows,
      storagePath: upload.storagePath,
      sqliteBytes: result.sqliteBytes,
      sqliteGzipBytes: result.sqliteGzipBytes,
      trigger,
    });

    return result;
  } finally {
    await rm(workDir, { recursive: true, force: true });
    await unlink(`${dbPath}-journal`).catch(() => undefined);
  }
};
