// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react';

const buildLocalStorageName = (userId, tableName) =>
  `tableColumnsOrder_${userId}_${tableName}`;

// Nueva función para verificar si la configuración ha cambiado
const hasConfigurationChanged = (defaultColumns, savedColumns) => {
  const defaultAccessors = new Set(defaultColumns.map((col) => col.accessor));
  const savedAccessors = new Set(savedColumns.map((col) => col.accessor));

  // Verifica si hay nuevas columnas o columnas eliminadas
  return (
    defaultColumns.length !== savedColumns.length ||
    [...defaultAccessors].some((accessor) => !savedAccessors.has(accessor)) ||
    [...savedAccessors].some((accessor) => !defaultAccessors.has(accessor))
  );
};

const getInitialColumnOrder = (columns, tableName, localStorageName) => {
  const defaultColumns = columns.map((col) => ({
    ...col,
    status: col.status || 'active',
  }));
  if (!tableName) return defaultColumns;

  try {
    const savedColumns = localStorage.getItem(localStorageName);
    if (!savedColumns) return defaultColumns;

    const parsedColumns = JSON.parse(savedColumns);

    // Verifica si hay cambios en la configuración
    if (hasConfigurationChanged(columns, parsedColumns)) {
      // Si hay cambios, elimina la configuración antigua y retorna la nueva
      localStorage.removeItem(localStorageName);
      return defaultColumns;
    }

    const validColumns = filterInvalidColumns(parsedColumns);
    const updatedColumns = mergeColumns(defaultColumns, validColumns);
    return updatedColumns;
  } catch (error) {
    console.error('Error al cargar la configuración de columnas:', error);
    return defaultColumns;
  }
};

// Función para filtrar columnas inválidas
const filterInvalidColumns = (columns) =>
  columns.filter(
    (savedCol) =>
      !(Object.keys(savedCol).length === 1 && savedCol.status === true),
  );

const mergeColumns = (defaultColumns, savedColumns) => {
  // Paso 1: Mantener columnas y orden del localStorage, asegurando que el estado se preserva
  const updatedColumns = savedColumns
    .map((savedCol) => {
      const originalCol = defaultColumns.find(
        (col) => col.accessor === savedCol.accessor,
      );
      // Si la columna original existe, se preserva el estado del localStorage
      return originalCol ? { ...originalCol, status: savedCol.status } : null;
    })
    .filter((col) => col !== null);

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

export const useColumnOrder = (columns = [], tableName, userId) => {
  const localStorageName = buildLocalStorageName(userId, tableName);
  const getColumnOrderFromStorage = useCallback(
    () => getInitialColumnOrder(columns, tableName, localStorageName),
    [tableName, columns, localStorageName],
  );

  const [columnOrder, setColumnOrder] = useState(getColumnOrderFromStorage);

  const resolvedColumnOrder = useMemo(() => {
    const defaultColumns = columns.map((col) => ({
      ...col,
      status: col.status || 'active',
    }));

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
      localStorage.setItem(localStorageName, JSON.stringify(resolvedColumnOrder));
    }
  }, [resolvedColumnOrder, localStorageName, tableName]);

  const resetColumnOrder = useCallback(() => {
    if (tableName) {
      localStorage.removeItem(localStorageName);
      setColumnOrder(columns.map((col) => ({ ...col, status: 'active' })));
    }
  }, [tableName, columns, localStorageName]);

  return [resolvedColumnOrder, setColumnOrder, resetColumnOrder];
};
