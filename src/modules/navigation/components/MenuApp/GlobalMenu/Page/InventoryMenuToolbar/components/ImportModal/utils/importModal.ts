import type { ImportModalUiAction, ImportModalUiState } from '../types';

export const PREVIEW_LIMIT = 20;

export const SUPPORTED_IMPORT_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/x-csv',
  'application/x-csv',
  'text/comma-separated-values',
  'text/x-comma-separated-values',
] satisfies readonly string[];

export const SUPPORTED_IMPORT_EXTENSIONS = ['xlsx', 'csv'] satisfies readonly string[];

export const initialImportModalUiState: ImportModalUiState = {
  activeTab: 'import',
  fileList: [],
  isImporting: false,
  isPreviewing: false,
  previewData: [],
  selectedOptionalFields: [],
};

export const importModalUiReducer = (
  state: ImportModalUiState,
  action: ImportModalUiAction,
): ImportModalUiState => {
  switch (action.type) {
    case 'patch':
      return {
        ...state,
        ...action.patch,
      };
    case 'resetImportState':
      return {
        ...state,
        fileList: [],
        previewData: [],
      };
    default:
      return state;
  }
};

export const getFileExtension = (fileName: string | undefined): string =>
  fileName?.split('.').pop()?.toLowerCase() || '';

export const isUnsupportedLegacyExcelFile = (file: File): boolean =>
  getFileExtension(file.name) === 'xls';

export const isValidImportFile = (file: File): boolean => {
  if (file.type && SUPPORTED_IMPORT_MIME_TYPES.includes(file.type)) {
    return true;
  }

  const extension = getFileExtension(file.name);
  if (extension === 'xls') return false;

  return SUPPORTED_IMPORT_EXTENSIONS.includes(extension);
};

export const flattenPreviewObject = (
  obj: unknown,
  parentKey = '',
  result: Record<string, unknown> = {},
) => {
  if (obj === null || obj === undefined) {
    result[parentKey || 'valor'] = obj;
    return result;
  }

  if (Array.isArray(obj)) {
    result[parentKey || '[]'] = obj
      .map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
      .join(', ');
    return result;
  }

  if (typeof obj !== 'object') {
    result[parentKey || 'valor'] = obj;
    return result;
  }

  Object.entries(obj || {}).forEach(([key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenPreviewObject(value, newKey, result);
      return;
    }

    if (Array.isArray(value)) {
      result[newKey] = value
        .map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
        .join(', ');
      return;
    }

    result[newKey] = value;
  });

  return result;
};
