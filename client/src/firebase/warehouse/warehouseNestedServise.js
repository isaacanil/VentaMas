import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';
import { listenAllWarehouses } from './warehouseService';
import { listenAllShelves } from './shelfService';
import { listenAllRowShelves } from './RowShelfService';
import { listenAllSegments } from './segmentService';
import { listenAllProductStockByLocation } from './productStockService';

export const useWarehouseHierarchy = () => {
  const user = useSelector(selectUser);
  const [warehouses, setWarehouses] = useState([]);
  const [shelves, setShelves] = useState({});
  const [rows, setRows] = useState({});
  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [shelvesLoading, setShelvesLoading] = useState({});
  const [rowsLoading, setRowsLoading] = useState({});
  const [segmentsLoading, setSegmentsLoading] = useState({});
  const [productStock, setProductStock] = useState({});
  const [productStockUnsubscribes, setProductStockUnsubscribes] = useState([]);

  useEffect(() => {
    if (!user?.businessID) return;

    // Cleanup previous listeners
    productStockUnsubscribes.forEach((unsubscribe) => unsubscribe());
    setProductStockUnsubscribes([]);

    setWarehousesLoading(true);
    const unsubscribeWarehouses = listenAllWarehouses(user, (warehouseData) => {
      setWarehouses(warehouseData);
      setWarehousesLoading(false);

      warehouseData.forEach((warehouse) => {
        // Subscribe to warehouse products
        const unsubscribeWarehouseStock = listenAllProductStockByLocation(
          user,
          { id: warehouse.id, type: 'warehouse' },
          (productStockData) => {
            setProductStock((prev) => ({
              ...prev,
              [warehouse.id]: productStockData,
            }));
          }
        );
        setProductStockUnsubscribes((prev) => [...prev, unsubscribeWarehouseStock]);

        setShelvesLoading((prev) => ({ ...prev, [warehouse.id]: true }));
        listenAllShelves(user, warehouse.id, (shelfData) => {
          setShelves((prev) => ({
            ...prev,
            [warehouse.id]: shelfData,
          }));
          setShelvesLoading((prev) => ({ ...prev, [warehouse.id]: false }));
          
          shelfData.forEach((shelf) => {
            // Subscribe to shelf products
            const unsubscribeShelfStock = listenAllProductStockByLocation(
              user,
              { id: shelf.id, type: 'shelf' },
              (productStockData) => {
                setProductStock((prev) => ({
                  ...prev,
                  [shelf.id]: productStockData,
                }));
              }
            );
            setProductStockUnsubscribes((prev) => [...prev, unsubscribeShelfStock]);

            setRowsLoading((prev) => ({ ...prev, [shelf.id]: true }));
            listenAllRowShelves(user, warehouse.id, shelf.id, (rowData) => {
              setRows((prev) => ({
                ...prev,
                [shelf.id]: rowData,
              }));
              setRowsLoading((prev) => ({ ...prev, [shelf.id]: false }));

              rowData.forEach((row) => {
                // Subscribe to row products
                const unsubscribeRowStock = listenAllProductStockByLocation(
                  user,
                  { id: row.id, type: 'row' },
                  (productStockData) => {
                    setProductStock((prev) => ({
                      ...prev,
                      [row.id]: productStockData,
                    }));
                  }
                );
                setProductStockUnsubscribes((prev) => [...prev, unsubscribeRowStock]);

                setSegmentsLoading((prev) => ({ ...prev, [row.id]: true }));
                listenAllSegments(user, warehouse.id, shelf.id, row.id, (segmentData) => {
                  setSegments((prev) => ({
                    ...prev,
                    [row.id]: segmentData,
                  }));
                  setSegmentsLoading((prev) => ({ ...prev, [row.id]: false }));

                  segmentData.forEach((segment) => {
                    // Subscribe to segment products
                    const unsubscribeSegmentStock = listenAllProductStockByLocation(
                      user,
                      { id: segment.id, type: 'segment' },
                      (productStockData) => {
                        setProductStock((prev) => ({
                          ...prev,
                          [segment.id]: productStockData,
                        }));
                      }
                    );
                    setProductStockUnsubscribes((prev) => [...prev, unsubscribeSegmentStock]);
                  });
                });
              });
            });
          });
        });
      });

      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeWarehouses();
      productStockUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  // Función para combinar los datos
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

  const combinedData = combineData();

  return {
    data: combinedData,
    loading,
    error,
    shelvesLoading,
    rowsLoading,
    segmentsLoading,
  };
};

// Función de transformación (sin cambios)
const transformData = (data, shelvesLoading, rowsLoading, segmentsLoading) => {
  return data.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name,
    isLoading: shelvesLoading[warehouse.id] !== false,
    productStock: warehouse.productStock || [], // Add productStock at warehouse level
    data: {
      owner: warehouse.owner,
      location: warehouse.location,
      address: warehouse.address,
      capacity: warehouse.capacity,
      dimension: warehouse.dimension,
      description: warehouse.description,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
      createdBy: warehouse.createdBy,
      updatedBy: warehouse.updatedBy,
      number: warehouse.number,
    },
    children: warehouse.shelves?.map((shelf) => ({
      id: shelf.id,
      name: shelf.name,
      isLoading: rowsLoading[shelf.id] !== false,
      productStock: shelf.productStock || [], // Add productStock at shelf level
      data: {
        rowCapacity: shelf.rowCapacity,
        shortName: shelf.shortName,
        description: shelf.description,
        createdAt: shelf.createdAt,
        updatedAt: shelf.updatedAt,
        createdBy: shelf.createdBy,
        updatedBy: shelf.updatedBy,
        warehouseId: shelf.warehouseId,
      },
      children: shelf.rows?.map((row) => ({
        id: row.id,
        name: row.name,
        isLoading: segmentsLoading[row.id] !== false,
        productStock: row.productStock || [], // Add productStock at row level
        data: {
          capacity: row.capacity,
          shortName: row.shortName,
          description: row.description,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          createdBy: row.createdBy,
          updatedBy: row.updatedBy,
          shelfId: row.shelfId,
        },
        children: row.segments?.map((segment) => ({
          id: segment.id,
          name: segment.name,
          isLoading: false, // Assuming segments load immediately
          productStock: segment.productStock || [], // Add productStock at segment level
          data: {
            capacity: segment.capacity,
            shortName: segment.shortName,
            description: segment.description,
            createdAt: segment.createdAt,
            updatedAt: segment.updatedAt,
            createdBy: segment.createdBy,
            updatedBy: segment.updatedBy,
            rowShelfId: segment.rowShelfId,
          },
          children: [], // Segmento no tiene hijos
        })) || [],
      })) || [],
    })) || [],
  }));
};

export const useTransformedWarehouseData = () => {
  const {
    data,
    loading,
    error,
    shelvesLoading,
    rowsLoading,
    segmentsLoading,
  } = useWarehouseHierarchy();

  const transformedData = useMemo(
    () =>
      data
        ? transformData(data, shelvesLoading, rowsLoading, segmentsLoading)
        : [],
    [data, shelvesLoading, rowsLoading, segmentsLoading]
  );

  return { data: transformedData, loading, error };
};