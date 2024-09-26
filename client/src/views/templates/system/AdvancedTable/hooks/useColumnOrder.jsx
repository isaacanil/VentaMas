import { useState, useEffect, useCallback } from 'react';

// Función para construir el nombre de la clave de localStorage
const buildLocalStorageName = (userId, tableName) => `tableColumnsOrder_${userId}_${tableName}`;

// Función para obtener el estado inicial de columnOrder desde localStorage o defaults
const getInitialColumnOrder = (columns, tableName, localStorageName) => {
  const defaultColumns = columns.map(col => ({ ...col, status: col.status || 'active' }));
  if (!tableName) return defaultColumns;
  const savedColumns = localStorage.getItem(localStorageName);

  if (savedColumns) {
    const parsedColumns = JSON.parse(savedColumns);
    const validColumns = filterInvalidColumns(parsedColumns);
    const updatedColumns = mergeColumns(columns, validColumns);
    return updatedColumns;
  } else {
    return defaultColumns;
  }
};

// Función para filtrar columnas inválidas
const filterInvalidColumns = (columns) => columns.filter(savedCol => !(Object.keys(savedCol).length === 1 && savedCol.status === true));

const mergeColumns = (defaultColumns, savedColumns) => {
  // Paso 1: Mantener columnas y orden del localStorage, asegurando que el estado se preserva
  const updatedColumns = savedColumns.map(savedCol => {
    const originalCol = defaultColumns.find(col => col.accessor === savedCol.accessor);
    // Si la columna original existe, se preserva el estado del localStorage
    return originalCol ? { ...originalCol, status: savedCol.status } : null;
  }).filter(col => col !== null);

  // Paso 2: Agregar nuevas columnas que no estén en el localStorage al final
  defaultColumns.forEach(col => {
    const isColumnSaved = savedColumns.some(savedCol => savedCol.accessor === col.accessor);
    // Si la columna por defecto no está en las guardadas, se agrega al final
    if (!isColumnSaved) {
      updatedColumns.push({ ...col, status: 'active' }); // Suponiendo que el estado por defecto de nuevas columnas es 'active'
    }
  });
  return updatedColumns;
};


export const useColumnOrder = (columns = [], tableName, userId) => {
  const localStorageName = buildLocalStorageName(userId, tableName);
  const getColumnOrderFromStorage = useCallback(() => getInitialColumnOrder(columns, tableName, localStorageName), [tableName, columns, localStorageName]);

  const [columnOrder, setColumnOrder] = useState(getColumnOrderFromStorage);

  useEffect(() => {
    if (tableName) {
      localStorage.setItem(localStorageName, JSON.stringify(columnOrder));
    }
  }, [columnOrder, localStorageName, tableName]);

  const resetColumnOrder = useCallback(() => {
    if (tableName) {
      localStorage.removeItem(localStorageName);
      setColumnOrder(columns.map(col => ({ ...col, status: 'active' })));
    }
  }, [tableName, columns, localStorageName]);

  return [columnOrder, setColumnOrder, resetColumnOrder];
};
