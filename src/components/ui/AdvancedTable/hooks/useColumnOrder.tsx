import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ColumnConfig, ColumnStatus } from '../types/ColumnTypes';

type ColumnStatusFlag = ColumnStatus | boolean | undefined;
type ColumnLike = { accessor: string; status?: ColumnStatusFlag };

const buildLocalStorageName = (
  userId?: string | null,
  tableName?: string | null,
) => `tableColumnsOrder_${userId}_${tableName}`;

// Nueva función para verificar si la configuración ha cambiado
const hasConfigurationChanged = <Col extends ColumnLike>(
  defaultColumns: Col[],
  savedColumns: ColumnLike[],
): boolean => {
  const defaultAccessors = new Set(defaultColumns.map((col) => col.accessor));
  const savedAccessors = new Set(savedColumns.map((col) => col.accessor));

  // Verifica si hay nuevas columnas o columnas eliminadas
  return (
    defaultColumns.length !== savedColumns.length ||
    [...defaultAccessors].some((accessor) => !savedAccessors.has(accessor)) ||
    [...savedAccessors].some((accessor) => !defaultAccessors.has(accessor))
  );
};

const getInitialColumnOrder = <Col extends ColumnLike>(
  columns: Col[],
  tableName?: string | null,
  localStorageName?: string,
): Col[] => {
  const defaultColumns = columns.map((col) => ({
    ...col,
    status: col.status || 'active',
  })) as Col[];
  if (!tableName) return defaultColumns;

  try {
    const savedColumns = localStorage.getItem(localStorageName);
    if (!savedColumns) return defaultColumns;

    const parsedColumns = JSON.parse(savedColumns) as unknown;
    if (!Array.isArray(parsedColumns)) {
      return defaultColumns;
    }
    const typedColumns = parsedColumns.filter(isColumnLike);

    // Verifica si hay cambios en la configuración
    if (hasConfigurationChanged(columns, typedColumns)) {
      // Si hay cambios, elimina la configuración antigua y retorna la nueva
      localStorage.removeItem(localStorageName);
      return defaultColumns;
    }

    const validColumns = filterInvalidColumns(typedColumns);
    const updatedColumns = mergeColumns(defaultColumns, validColumns);
    return updatedColumns;
  } catch (error) {
    console.error('Error al cargar la configuración de columnas:', error);
    return defaultColumns;
  }
};

// Función para filtrar columnas inválidas
const isColumnLike = (value: unknown): value is ColumnLike => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as Record<string, unknown>).accessor === 'string';
};

const filterInvalidColumns = <Col extends ColumnLike>(columns: Col[]): Col[] =>
  columns.filter(
    (savedCol) =>
      !(Object.keys(savedCol).length === 1 && savedCol.status === true),
  );

const mergeColumns = <Col extends ColumnLike>(
  defaultColumns: Col[],
  savedColumns: ColumnLike[],
): Col[] => {
  // Paso 1: Mantener columnas y orden del localStorage, asegurando que el estado se preserva
  const updatedColumns = savedColumns
    .map((savedCol) => {
      const originalCol = defaultColumns.find(
        (col) => col.accessor === savedCol.accessor,
      );
      // Si la columna original existe, se preserva el estado del localStorage
      return originalCol ? { ...originalCol, status: savedCol.status } : null;
    })
    .filter((col): col is Col => col !== null);

  // Paso 2: Agregar nuevas columnas que no estén en el localStorage al final
  defaultColumns.forEach((col) => {
    const isColumnSaved = savedColumns.some(
      (savedCol) => savedCol.accessor === col.accessor,
    );
    // Si la columna por defecto no está en las guardadas, se agrega al final
    if (!isColumnSaved) {
      updatedColumns.push({ ...col, status: 'active' }); // Suponiendo que el estado por defecto de nuevas columnas es 'active'
    }
  });
  return updatedColumns;
};

export const useColumnOrder = <Col extends ColumnConfig>(
  columns: Col[] = [],
  tableName?: string | null,
  userId?: string | null,
) => {
  const localStorageName = buildLocalStorageName(userId, tableName);
  const getColumnOrderFromStorage = useCallback(
    () => getInitialColumnOrder(columns, tableName, localStorageName),
    [tableName, columns, localStorageName],
  );

  const [columnOrder, setColumnOrder] = useState<Col[]>(
    getColumnOrderFromStorage,
  );

  const resolvedColumnOrder = useMemo(() => {
    const defaultColumns = columns.map((col) => ({
      ...col,
      status: col.status || 'active',
    })) as Col[];

    if (!Array.isArray(columnOrder) || columnOrder.length === 0) {
      return defaultColumns;
    }

    if (hasConfigurationChanged(defaultColumns, columnOrder)) {
      return defaultColumns;
    }

    const validColumns = filterInvalidColumns(columnOrder);
    return mergeColumns(defaultColumns, validColumns);
  }, [columns, columnOrder]);

  useEffect(() => {
    if (tableName) {
      localStorage.setItem(
        localStorageName,
        JSON.stringify(resolvedColumnOrder),
      );
    }
  }, [resolvedColumnOrder, localStorageName, tableName]);

  const resetColumnOrder = useCallback(() => {
    if (tableName) {
      localStorage.removeItem(localStorageName);
      setColumnOrder(
        columns.map((col) => ({ ...col, status: 'active' })) as Col[],
      );
    }
  }, [tableName, columns, localStorageName]);

  return [resolvedColumnOrder, setColumnOrder, resetColumnOrder] as const;
};
