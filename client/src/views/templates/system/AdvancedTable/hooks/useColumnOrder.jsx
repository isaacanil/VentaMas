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
        return { ...originalCol };
      });
    } else {
      return columns || [];
    }
  });

  // Actualizar localStorage cuando columnOrder cambie
  useEffect(() => {
    if (tableName) {
      console.log("Updating localStorage with columnOrder:", columnOrder);
      localStorage.setItem(localStorageName, JSON.stringify(columnOrder));
    }
  }, [columnOrder]);

  // Función para restablecer el orden de las columnas
  const resetColumnOrder = () => {
    if (tableName) {
      localStorage.removeItem(localStorageName);
    }
    setColumnOrder(columns);
  };

  return [columnOrder, setColumnOrder, resetColumnOrder];
};
