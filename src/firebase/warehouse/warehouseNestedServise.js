import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';

// Servicios de escucha
import { listenAllProductStockByLocation } from './productStockService';
import { listenAllRowShelves } from './RowShelfService';
import { listenAllSegments } from './segmentService';
import { listenAllShelves } from './shelfService';
import { listenAllWarehouses } from './warehouseService';

export const useWarehouseHierarchy = () => {
  const user = useSelector(selectUser);

  const [warehouses, setWarehouses] = useState([]);
  const [shelves, setShelves] = useState({});
  const [rows, setRows] = useState({});
  const [segments, setSegments] = useState({});
  const [productStock, setProductStock] = useState({});

  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [shelvesLoading, setShelvesLoading] = useState({});
  const [rowsLoading, setRowsLoading] = useState({});
  const [segmentsLoading, setSegmentsLoading] = useState({});
  const [error, setError] = useState(null);

  const [warehouseUnsubscribe, setWarehouseUnsubscribe] = useState(null);
  const [shelvesUnsubscribes, setShelvesUnsubscribes] = useState([]);
  const [rowsUnsubscribes, setRowsUnsubscribes] = useState([]);
  const [segmentsUnsubscribes, setSegmentsUnsubscribes] = useState([]);
  const [productStockUnsubscribes, setProductStockUnsubscribes] = useState([]);

  // ---------------------------------------------------
  // Escucha de WAREHOUSES
  // ---------------------------------------------------
  useEffect(() => {
    if (!user?.businessID) return;

    if (warehouseUnsubscribe) {
      warehouseUnsubscribe();
    }

    setWarehousesLoading(true);

    const unsubscribe = listenAllWarehouses(
      user,
      (warehouseData) => {
        setWarehouses(warehouseData);
        setWarehousesLoading(false);
      },
      (err) => {
        setError(err);
        setWarehousesLoading(false);
      }
    );

    setWarehouseUnsubscribe(() => unsubscribe);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // ---------------------------------------------------
  // Escucha de SHELVES
  // ---------------------------------------------------
  useEffect(() => {
    shelvesUnsubscribes.forEach((u) => u());
    setShelvesUnsubscribes([]);

    const newUnsubscribes = [];

    warehouses.forEach((warehouse) => {
      setShelvesLoading((prev) => ({ ...prev, [warehouse.id]: true }));

      const unsubscribe = listenAllShelves(
        user,
        warehouse.id,
        (shelfData) => {
          setShelves((prev) => ({ ...prev, [warehouse.id]: shelfData }));
          setShelvesLoading((prev) => ({ ...prev, [warehouse.id]: false }));
        },
        (err) => {
          setError(err);
          setShelvesLoading((prev) => ({ ...prev, [warehouse.id]: false }));
        }
      );

      newUnsubscribes.push(unsubscribe);
    });

    setShelvesUnsubscribes(newUnsubscribes);

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [warehouses, user]);

  // ---------------------------------------------------
  // Escucha de ROWS
  // ---------------------------------------------------
  useEffect(() => {
    rowsUnsubscribes.forEach((u) => u());
    setRowsUnsubscribes([]);

    const newUnsubscribes = [];

    Object.keys(shelves).forEach((warehouseId) => {
      shelves[warehouseId].forEach((shelf) => {
        setRowsLoading((prev) => ({ ...prev, [shelf.id]: true }));

        const unsubscribe = listenAllRowShelves(
          user,
          warehouseId,
          shelf.id,
          (rowData) => {
            setRows((prev) => ({ ...prev, [shelf.id]: rowData }));
            setRowsLoading((prev) => ({ ...prev, [shelf.id]: false }));
          },
          (err) => {
            setError(err);
            setRowsLoading((prev) => ({ ...prev, [shelf.id]: false }));
          }
        );

        newUnsubscribes.push(unsubscribe);
      });
    });

    setRowsUnsubscribes(newUnsubscribes);

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [shelves, user]);

  // ---------------------------------------------------
  // Escucha de SEGMENTS
  // ---------------------------------------------------
  useEffect(() => {
    segmentsUnsubscribes.forEach((u) => u());
    setSegmentsUnsubscribes([]);

    const newUnsubscribes = [];

    Object.keys(rows).forEach((shelfId) => {
      rows[shelfId].forEach((row) => {
        setSegmentsLoading((prev) => ({ ...prev, [row.id]: true }));

        const unsubscribe = listenAllSegments(
          user,
          row.warehouseId, // Debes agregar esta propiedad en tu servicio
          row.shelfId,
          row.id,
          (segmentData) => {
            setSegments((prev) => ({ ...prev, [row.id]: segmentData }));
            setSegmentsLoading((prev) => ({ ...prev, [row.id]: false }));
          },
          (err) => {
            setError(err);
            setSegmentsLoading((prev) => ({ ...prev, [row.id]: false }));
          }
        );

        newUnsubscribes.push(unsubscribe);
      });
    });

    setSegmentsUnsubscribes(newUnsubscribes);

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [rows, user]);

  // ---------------------------------------------------
  // Escucha de PRODUCT STOCK
  // ---------------------------------------------------
  useEffect(() => {
    productStockUnsubscribes.forEach((u) => u());
    setProductStockUnsubscribes([]);

    const newUnsubscribes = [];

    // Warehouses
    warehouses.forEach((warehouse) => {
      const unsubscribe = listenAllProductStockByLocation(
        user,
        { id: warehouse.id, type: 'warehouse' },
        (stockData) => {
          setProductStock((prev) => ({ ...prev, [warehouse.id]: stockData }));
        },
        (err) => setError(err)
      );
      newUnsubscribes.push(unsubscribe);
    });

    // Shelves
    Object.keys(shelves).forEach((warehouseId) => {
      shelves[warehouseId].forEach((shelf) => {
        const unsubscribe = listenAllProductStockByLocation(
          user,
          { id: shelf.id, type: 'shelf' },
          (stockData) => {
            setProductStock((prev) => ({ ...prev, [shelf.id]: stockData }));
          },
          (err) => setError(err)
        );
        newUnsubscribes.push(unsubscribe);
      });
    });

    // Rows and Segments...
    // (Similar lógica para rows y segments)

    setProductStockUnsubscribes(newUnsubscribes);

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [warehouses, shelves, rows, segments, user]);

  // ---------------------------------------------------
  // Combinar datos en estructura final
  // ---------------------------------------------------
  const combineData = () => {
    return warehouses.map((warehouse) => {
      const warehouseShelves = shelves[warehouse.id] || [];
      return {
        ...warehouse,
        productStock: productStock[warehouse.id] || [],
        shelves: warehouseShelves.map((shelf) => {
          const shelfRows = rows[shelf.id] || [];
          return {
            ...shelf,
            productStock: productStock[shelf.id] || [],
            rows: shelfRows.map((row) => {
              const rowSegments = segments[row.id] || [];
              return {
                ...row,
                productStock: productStock[row.id] || [],
                segments: rowSegments.map((segment) => ({
                  ...segment,
                  productStock: productStock[segment.id] || [],
                })),
              };
            }),
          };
        }),
      };
    });
  };

  const data = useMemo(() => combineData(), [
    warehouses,
    shelves,
    rows,
    segments,
    productStock,
  ]);

  const overallLoading =
    warehousesLoading ||
    Object.values(shelvesLoading).some(Boolean) ||
    Object.values(rowsLoading).some(Boolean) ||
    Object.values(segmentsLoading).some(Boolean);

  return { data, loading: overallLoading, error };
};

export const useTransformedWarehouseData = () => {
  const { data, loading, error } = useWarehouseHierarchy();

  const transformData = (data) => {
    return data.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      children: warehouse.shelves?.map((shelf) => ({
        id: shelf.id,
        name: shelf.name,
        children: shelf.rows?.map((row) => ({
          id: row.id,
          name: row.name,
          children: row.segments?.map((segment) => ({
            id: segment.id,
            name: segment.name,
          })),
        })),
      })),
    }));
  };

  const transformedData = useMemo(() => transformData(data), [data]);

  return { data: transformedData, loading, error };
};
