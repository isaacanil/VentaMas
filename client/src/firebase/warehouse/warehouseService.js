// warehouseService.js
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';
import { warehouseRepository } from './warehouseRepository';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
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
export const useGetWarehouseData = (items) => {
  const user = useSelector(selectUser);
  const [data, setData] = useState({
    warehouses: [],
    shelves: [],
    rows: [],
    segments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(!Array.isArray(items) && !items.length === 0) {
       return;
    }
   
  }, [items, user]);
  return { data, loading, error };
};