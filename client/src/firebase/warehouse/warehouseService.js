// warehouseService.js
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';
import { warehouseRepository } from './warehouseRepository';
import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';

// Servicio para crear un nuevo almacén
export const createWarehouse = async (user, warehouseData) => {
  try {
    // Aquí podrías añadir lógica de negocio adicional si es necesario
    return await warehouseRepository.create(user, warehouseData);
  } catch (error) {
    console.error('Error al crear el almacén: ', error); w

    throw error;
  }
};

// Servicio para obtener todos los almacenes de un negocio específico
export const getWarehouses = async (user) => {
  try {
    return await warehouseRepository.readAll(user);
  } catch (error) {
    console.error('Error al obtener almacenes: ', error);
    throw error;
  }
};

// Servicio para obtener un almacén específico por ID
export const getWarehouse = async (user, id) => {
  try {
    return await warehouseRepository.read(user, id);
  } catch (error) {
    console.error('Error al obtener el almacén: ', error);
    throw error;
  }
};

// Servicio para escuchar cambios en un almacén en tiempo real
export const listenWarehouse = (user, id, callback) => {
  try {
    return warehouseRepository.listen(user, id, callback);
  } catch (error) {
    console.error('Error al escuchar los cambios del almacén: ', error);
    throw error;
  }
};

// Servicio para actualizar un almacén
export const updateWarehouse = async (user, id, updatedData) => {
  try {
    return await warehouseRepository.update(user, id, updatedData);
  } catch (error) {
    console.error('Error al actualizar el almacén: ', error);
    throw error;
  }
};

// Servicio para borrar (marcar como eliminado) un almacén
export const deleteWarehouse = async (user, id) => {
  try {
    return await warehouseRepository.remove(user, id);
  } catch (error) {
    console.error('Error al borrar el almacén: ', error);
    throw error;
  }
};

export const useListenWarehouse = (id) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log("data: ", data)

  useEffect(() => {
    if (!id) {
      setData([]);
      setLoading(false);
      return;
    }
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenWarehouse(user, id, (data) => {
      setData(data);
      setLoading(false);
    });
    return () => unsubscribe();

  }, [id, user]);

  return { data, loading, error };
}

export const useListenWarehouses = () => {
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.businessID) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = warehouseRepository.listenAll(user, (data) => {
      setData(data);
      setLoading(false);
    });
    return () => unsubscribe();

  }, [user]);

  return { data, loading, error };
}
export const useGetWarehouseData = (user, items) => {
  const [data, setData] = useState({
    warehouses: [],
    shelves: [],
    rows: [],
    segments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Función para obtener datos de almacenes, estanterías, filas y segmentos.
   * Memoizada con useCallback para evitar recreaciones innecesarias.
   */
  const fetchData = useCallback(async () => {
    // Validaciones iniciales
    if (!user?.businessID) {
      setData({
        warehouses: [],
        shelves: [],
        rows: [],
        segments: []
      });
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      setData({
        warehouses: [],
        shelves: [],
        rows: [],
        segments: []
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Función para generar una clave única por item
      const getItemKey = (item) => {
        return `${item.warehouseId || ''}_${item.shelfId || ''}_${item.rowShelfId || ''}_${item.segmentId || ''}`;
      };

      // Filtrar items únicos
      const uniqueItemsMap = new Map(items.map(item => [getItemKey(item), item]));
      const uniqueItems = Array.from(uniqueItemsMap.values());
      console.log("uniqueItems", uniqueItems);

      // Inicializar arreglos para cada nivel
      const warehouses = [];
      const shelves = [];
      const rows = [];
      const segments = [];

      // Crear promesas para obtener datos de Firestore
      const promises = uniqueItems.map(async (item) => {
        // Validar que warehouseId exista
        if (!item.warehouseId) {
          throw new Error('warehouseId es requerido');
        }

        // Construir la referencia al documento según el nivel
        let docRef = doc(db, "businesses", user.businessID, "warehouses", item.warehouseId);
        let level = 'warehouses'; // Nivel por defecto
        let ids = { warehouseId: item.warehouseId };

        if (item.shelfId) {
          docRef = doc(docRef, "shelves", item.shelfId);
          level = 'shelves';
          ids.shelfId = item.shelfId;
        }
        if (item.rowShelfId) {
          docRef = doc(docRef, "rows", item.rowShelfId);
          level = 'rows';
          ids.rowShelfId = item.rowShelfId;
        }
        if (item.segmentId) {
          docRef = doc(docRef, "segments", item.segmentId);
          level = 'segments';
          ids.segmentId = item.segmentId;
        }

        // Obtener el documento de Firestore
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error(`No se encontró el documento en la ruta: ${docRef.path}`);
        }

        const dataWithId = { id: docSnap.id, data: docSnap.data(), ...ids };

        // Agregar el dato al arreglo correspondiente
        switch (level) {
          case 'warehouses':
            warehouses.push(dataWithId);
            break;
          case 'shelves':
            shelves.push(dataWithId);
            break;
          case 'rows':
            rows.push(dataWithId);
            break;
          case 'segments':
            segments.push(dataWithId);
            break;
          default:
            break;
        }
      });

      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promises);

      // Actualizar el estado con los datos obtenidos
      setData({
        warehouses,
        shelves,
        rows,
        segments
      });

    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [items, user.businessID]);

  /**
   * useEffect para ejecutar fetchData cuando cambian los items o el user.
   * Dependencia única a fetchData gracias a useCallback.
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
};