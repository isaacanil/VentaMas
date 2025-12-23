import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';

// Servicios de escucha
import { listenAllProductStockByLocation } from './productStockService';
import { listenAllRowShelves } from './RowShelfService';
import { listenAllSegments } from './segmentService';
import { listenAllShelves } from './shelfService';
import { listenAllWarehouses } from './warehouseService';

export const useWarehouseHierarchy = () => {
  const user = useSelector(selectUser);
  const businessId = user?.businessID ?? null;

  const [warehouses, setWarehouses] = useState([]);
  const [shelves, setShelves] = useState({});
  const [rows, setRows] = useState({});
  const [segments, setSegments] = useState({});
  const [productStock, setProductStock] = useState({});

  const [shelvesLoading, setShelvesLoading] = useState({});
  const [rowsLoading, setRowsLoading] = useState({});
  const [segmentsLoading, setSegmentsLoading] = useState({});
  const [error, setError] = useState(null);

  const warehouseUnsubscribeRef = useRef(null);
  const shelvesUnsubscribesRef = useRef([]);
  const rowsUnsubscribesRef = useRef([]);
  const segmentsUnsubscribesRef = useRef([]);
  const productStockUnsubscribesRef = useRef([]);

  const [warehousesLoadedFor, setWarehousesLoadedFor] = useState(null);
  const warehousesLoading =
    businessId !== null && warehousesLoadedFor !== businessId;

  // ---------------------------------------------------
  // Escucha de WAREHOUSES
  // ---------------------------------------------------
  useEffect(() => {
    if (!businessId) return;

    if (warehouseUnsubscribeRef.current) warehouseUnsubscribeRef.current();

    const unsubscribe = listenAllWarehouses(
      user,
      (warehouseData) => {
        setWarehouses(warehouseData);
        setWarehousesLoadedFor(businessId);
      },
      (err) => {
        setError(err);
        setWarehousesLoadedFor(businessId);
      },
    );

    warehouseUnsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [businessId, user]);

  // ---------------------------------------------------
  // Escucha de SHELVES
  // ---------------------------------------------------
  useEffect(() => {
    shelvesUnsubscribesRef.current.forEach((u) => u());
    shelvesUnsubscribesRef.current = [];

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
        },
      );

      newUnsubscribes.push(unsubscribe);
    });

    shelvesUnsubscribesRef.current = newUnsubscribes;

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [warehouses, user]);

  // ---------------------------------------------------
  // Escucha de ROWS
  // ---------------------------------------------------
  useEffect(() => {
    rowsUnsubscribesRef.current.forEach((u) => u());
    rowsUnsubscribesRef.current = [];

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
          },
        );

        newUnsubscribes.push(unsubscribe);
      });
    });

    rowsUnsubscribesRef.current = newUnsubscribes;

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [shelves, user]);

  // ---------------------------------------------------
  // Escucha de SEGMENTS
  // ---------------------------------------------------
  useEffect(() => {
    segmentsUnsubscribesRef.current.forEach((u) => u());
    segmentsUnsubscribesRef.current = [];

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
          },
        );

        newUnsubscribes.push(unsubscribe);
      });
    });

    segmentsUnsubscribesRef.current = newUnsubscribes;

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [rows, user]);

  // ---------------------------------------------------
  // Escucha de PRODUCT STOCK
  // ---------------------------------------------------
  useEffect(() => {
    productStockUnsubscribesRef.current.forEach((u) => u());
    productStockUnsubscribesRef.current = [];

    const newUnsubscribes = [];

    // Warehouses
    warehouses.forEach((warehouse) => {
      const unsubscribe = listenAllProductStockByLocation(
        user,
        { id: warehouse.id, type: 'warehouse' },
        (stockData) => {
          setProductStock((prev) => ({ ...prev, [warehouse.id]: stockData }));
        },
        (err) => setError(err),
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
          (err) => setError(err),
        );
        newUnsubscribes.push(unsubscribe);
      });
    });

    // Rows and Segments...
    // (Similar lógica para rows y segments)

    productStockUnsubscribesRef.current = newUnsubscribes;

    return () => {
      newUnsubscribes.forEach((u) => u());
    };
  }, [warehouses, shelves, rows, segments, user]);

  // ---------------------------------------------------
  // Combinar datos en estructura final
  // ---------------------------------------------------
  const data = useMemo(() => {
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
  }, [warehouses, shelves, rows, segments, productStock]);

  const overallLoading =
    warehousesLoading ||
    Object.values(shelvesLoading).some(Boolean) ||
    Object.values(rowsLoading).some(Boolean) ||
    Object.values(segmentsLoading).some(Boolean);

  return { data, loading: overallLoading, error };
};

const omitKeys = (entity = {}, keys = []) => {
  return Object.keys(entity || {}).reduce((acc, key) => {
    if (!keys.includes(key)) {
      acc[key] = entity[key];
    }
    return acc;
  }, {});
};

const sanitizeWarehouse = (warehouse) =>
  omitKeys(warehouse, ['shelves', 'rows', 'segments', 'productStock']);
const sanitizeShelf = (shelf) =>
  omitKeys(shelf, ['rows', 'segments', 'productStock']);
const sanitizeRow = (row) => omitKeys(row, ['segments', 'productStock']);
const sanitizeSegment = (segment) => omitKeys(segment, ['productStock']);

export const useTransformedWarehouseData = () => {
  const { data, loading, error } = useWarehouseHierarchy();

  const transformData = (data) => {
    return data.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      type: 'warehouse',
      record: sanitizeWarehouse(warehouse),
      children: warehouse.shelves?.map((shelf) => ({
        id: shelf.id,
        name: shelf.name,
        type: 'shelf',
        record: sanitizeShelf(shelf),
        children: shelf.rows?.map((row) => ({
          id: row.id,
          name: row.name,
          type: 'row',
          record: sanitizeRow(row),
          children: row.segments?.map((segment) => ({
            id: segment.id,
            name: segment.name,
            type: 'segment',
            record: sanitizeSegment(segment),
          })),
        })),
      })),
    }));
  };

  const transformedData = useMemo(() => transformData(data), [data]);

  return { data: transformedData, loading, error };
};
