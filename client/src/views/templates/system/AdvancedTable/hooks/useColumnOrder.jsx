import { useState, useEffect } from 'react';

export const useColumnOrder = (columns = [], tableName, userId) => {
  // Construir el nombre de la clave de localStorage
  const localStorageName = `tableColumnsOrder_${userId}_${tableName}`;

  // Inicializar el estado de columnOrder
  const [columnOrder, setColumnOrder] = useState(() => {
    if (!tableName) return columns;
    const savedColumns = localStorage.getItem(localStorageName);

    if (savedColumns) {
      const parsedColumns = JSON.parse(savedColumns);
      return parsedColumns.map(savedCol => {
        const originalCol = columns.find(col => col.accessor === savedCol.accessor);
        return {
          ...originalCol,
          status: savedCol.status || 'active' // Asegura que todas las columnas tengan un status
        };
      });
    } else {
      // Asignar 'active' como status por defecto a las columnas que no tienen status
      return columns.map(col => ({
        ...col,
        status: col.status || 'active'
      }));
    }
  });

  // Actualizar localStorage cuando columnOrder cambie
  useEffect(() => {
    if (tableName) {
      localStorage.setItem(localStorageName, JSON.stringify(columnOrder));
    }
  }, [columnOrder, localStorageName]);

  // Función para restablecer el orden de las columnas
  const resetColumnOrder = () => {
    if (tableName) {
      localStorage.removeItem(localStorageName);
    }
    setColumnOrder(columns.map(col => ({
      ...col,
      status: 'active'
    })));
  };

  return [columnOrder, setColumnOrder, resetColumnOrder];
};
