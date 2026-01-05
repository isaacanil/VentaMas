import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import type { InventoryStockItem, InventoryUser } from '@/utils/inventory/types';
import type { RowShelf } from '@/models/Warehouse/RowShelf';
import type { Segment } from '@/models/Warehouse/Segment';
import type { Shelf } from '@/models/Warehouse/Shelf';
import type { Warehouse } from '@/models/Warehouse/Warehouse';

// Servicios de escucha
import { listenAllProductStockByLocation } from './productStockService';
import { listenAllRowShelves } from './RowShelfService';
import { listenAllSegments } from './segmentService';
import { listenAllShelves } from './shelfService';
import { listenAllWarehouses } from './warehouseService';

type WarehouseRecord = Partial<Warehouse> & {
  id: string;
  shelves?: ShelfRecord[];
  productStock?: InventoryStockItem[];
};

type ShelfRecord = Partial<Shelf> & {
  id: string;
  rows?: RowRecord[];
  productStock?: InventoryStockItem[];
};

type RowRecord = Partial<RowShelf> & {
  id: string;
  segments?: SegmentRecord[];
  productStock?: InventoryStockItem[];
  warehouseId?: string;
  shelfId?: string;
};

type SegmentRecord = Partial<Segment> & {
  id: string;
  productStock?: InventoryStockItem[];
};

type WarehouseStockMap = Record<string, InventoryStockItem[]>;

type LoadingMap = Record<string, boolean>;

export const useWarehouseHierarchy = () => {
  const user = useSelector(selectUser) as InventoryUser | null;
  const businessId = user?.businessID ?? null;

  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [shelves, setShelves] = useState<Record<string, ShelfRecord[]>>({});
  const [rows, setRows] = useState<Record<string, RowRecord[]>>({});
  const [segments, setSegments] = useState<Record<string, SegmentRecord[]>>({});
  const [productStock, setProductStock] = useState<WarehouseStockMap>({});
  const [shelvesLoading, setShelvesLoading] = useState<LoadingMap>({});
  const [rowsLoading, setRowsLoading] = useState<LoadingMap>({});
  const [segmentsLoading, setSegmentsLoading] = useState<LoadingMap>({});
  const [error, setError] = useState<unknown | null>(null);

  const warehouseUnsubscribeRef = useRef<(() => void) | null>(null);
  const shelvesUnsubscribesRef = useRef<(() => void)[]>([]);
  const rowsUnsubscribesRef = useRef<(() => void)[]>([]);
  const segmentsUnsubscribesRef = useRef<(() => void)[]>([]);
  const productStockUnsubscribesRef = useRef<(() => void)[]>([]);

  const [warehousesLoadedFor, setWarehousesLoadedFor] = useState<string | null>(
    null,
  );
  const warehousesLoading =
    businessId !== null && warehousesLoadedFor !== businessId;

  // ---------------------------------------------------
  // Escucha de WAREHOUSES
  // ---------------------------------------------------
  useEffect(() => {
    if (!businessId) return;

    warehouseUnsubscribeRef.current?.();

    const unsubscribe = listenAllWarehouses(
      user,
      (warehouseData) => {
        setWarehouses(warehouseData as WarehouseRecord[]);
        setWarehousesLoadedFor(businessId);
      },
      (err) => {
        setError(err);
        setWarehousesLoadedFor(businessId);
      },
    );

    if (unsubscribe) {
      warehouseUnsubscribeRef.current = unsubscribe;
    }

    return () => {
      unsubscribe?.();
    };
  }, [businessId, user]);

  // ---------------------------------------------------
  // Escucha de SHELVES
  // ---------------------------------------------------
  useEffect(() => {
    shelvesUnsubscribesRef.current.forEach((u) => u());
    shelvesUnsubscribesRef.current = [];

    const newUnsubscribes: (() => void)[] = [];

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

      if (unsubscribe) newUnsubscribes.push(unsubscribe);
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

    const newUnsubscribes: (() => void)[] = [];

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

        if (unsubscribe) newUnsubscribes.push(unsubscribe);
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

    const newUnsubscribes: (() => void)[] = [];

    Object.keys(rows).forEach((shelfId) => {
      rows[shelfId].forEach((row) => {
        setSegmentsLoading((prev) => ({ ...prev, [row.id]: true }));

        const unsubscribe = listenAllSegments(
          user,
          row.warehouseId,
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

        if (unsubscribe) newUnsubscribes.push(unsubscribe);
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

    const newUnsubscribes: (() => void)[] = [];

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
      if (unsubscribe) newUnsubscribes.push(unsubscribe);
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
        if (unsubscribe) newUnsubscribes.push(unsubscribe);
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

type TreeNode = {
  id: string;
  name?: string;
  type: 'warehouse' | 'shelf' | 'row' | 'segment';
  record: Record<string, unknown>;
  children?: TreeNode[];
};

const omitKeys = (entity: Record<string, unknown> = {}, keys: string[] = []) => {
  return Object.keys(entity || {}).reduce<Record<string, unknown>>((acc, key) => {
    if (!keys.includes(key)) {
      acc[key] = entity[key];
    }
    return acc;
  }, {});
};

const sanitizeWarehouse = (warehouse: Record<string, unknown>) =>
  omitKeys(warehouse, ['shelves', 'rows', 'segments', 'productStock']);
const sanitizeShelf = (shelf: Record<string, unknown>) =>
  omitKeys(shelf, ['rows', 'segments', 'productStock']);
const sanitizeRow = (row: Record<string, unknown>) =>
  omitKeys(row, ['segments', 'productStock']);
const sanitizeSegment = (segment: Record<string, unknown>) =>
  omitKeys(segment, ['productStock']);

export const useTransformedWarehouseData = () => {
  const { data, loading, error } = useWarehouseHierarchy();

  const transformData = (entries: WarehouseRecord[]): TreeNode[] => {
    return entries.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name as string | undefined,
      type: 'warehouse',
      record: sanitizeWarehouse(warehouse as Record<string, unknown>),
      children: warehouse.shelves?.map((shelf) => ({
        id: shelf.id,
        name: shelf.name as string | undefined,
        type: 'shelf',
        record: sanitizeShelf(shelf as Record<string, unknown>),
        children: shelf.rows?.map((row) => ({
          id: row.id,
          name: row.name as string | undefined,
          type: 'row',
          record: sanitizeRow(row as Record<string, unknown>),
          children: row.segments?.map((segment) => ({
            id: segment.id,
            name: segment.name as string | undefined,
            type: 'segment',
            record: sanitizeSegment(segment as Record<string, unknown>),
          })),
        })),
      })),
    }));
  };

  const transformedData = useMemo(() => transformData(data), [data]);

  return { data: transformedData, loading, error };
};