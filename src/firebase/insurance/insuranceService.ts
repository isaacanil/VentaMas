// @ts-nocheck
import { nanoid } from '@reduxjs/toolkit';
import {
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  collection,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

export const updateInsuranceConfig = async ({ ref, insuranceData }) =>
  await updateDoc(ref, insuranceData);

export const addInsuranceConfig = async ({ user, ref, insuranceData }) => {
  await setDoc(ref, {
    ...insuranceData,
    createdAt: serverTimestamp(),
    createdBy: user.uid,
  });
};

export const saveInsuranceConfig = async (user, insuranceData) => {
  try {
    if (!user.businessID) throw new Error('No business ID found');

    const id = insuranceData.id || nanoid();
    const insuranceRef = doc(
      db,
      'businesses',
      user.businessID,
      'insuranceConfig',
      id,
    );

    if (insuranceData.id) {
      await updateInsuranceConfig({ ref: insuranceRef, insuranceData });
    } else {
      await addInsuranceConfig({
        user,
        ref: insuranceRef,
        insuranceData: { id, ...insuranceData },
      });
    }
    return id;
  } catch (error) {
    console.error('Error saving insurance:', error);
    throw error;
  }
};

export const getInsurance = async (user, insuranceId) => {
  if (!user.businessID) {
    throw new Error('No se encontró un ID de negocio');
  }
  if (!insuranceId) {
    throw new Error('No se encontró un ID de seguro');
  }
  try {
    const insuranceRef = doc(
      db,
      'businesses',
      user.businessID,
      'insuranceConfig',
      insuranceId,
    );
    const insuranceDoc = await getDoc(insuranceRef);
    if (insuranceDoc.exists()) {
      return insuranceDoc.data();
    } else {
      throw new Error('No se encontró el documento de seguro');
    }
  } catch (error) {
    console.error('Error al obtener el seguro:', error);
    throw error;
  }
};

export function listenInsuranceConfig(user, callback, errorCallback) {
  if (!user.businessID) {
    throw new Error('No se encontró un ID de negocio');
  }

  try {
    const insuranceRef = collection(
      db,
      'businesses',
      user.businessID,
      'insuranceConfig',
    );
    return onSnapshot(
      insuranceRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        callback(data);
      },
      (error) => {
        console.error('Error al escuchar la configuración de seguros:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      },
    );
  } catch (error) {
    console.error('Error al configurar el listener:', error);
    if (errorCallback) {
      errorCallback(error);
    }
    return undefined;
  }
}

export const useListenInsuranceConfig = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(selectUser);

  const [prevBusinessID, setPrevBusinessID] = useState(user?.businessID);

  if (user?.businessID !== prevBusinessID) {
    setPrevBusinessID(user?.businessID);
    setLoading(true);
  }

  if (!user?.businessID && loading) {
    setLoading(false);
  }

  useEffect(() => {
    if (!user?.businessID) {
      return undefined;
    }

    const unsubscribe = listenInsuranceConfig(
      user,
      (data) => {
        setData(data);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      },
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  return { data, loading, error };
};
