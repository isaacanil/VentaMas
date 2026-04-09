import { collection, getDocs } from 'firebase/firestore';

import { fbGetUsers } from '@/firebase/Auth/fbAuthV2/fbGetUsers';
import { fbUpdateUserPassword } from '@/firebase/Auth/fbAuthV2/fbUpdateUserPassword';
import {
  fbGetDeveloperBusinessImpersonationStatus,
  fbStartDeveloperBusinessImpersonation,
  fbStopDeveloperBusinessImpersonation,
} from '@/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness';
import { fbSwitchUserRole } from '@/firebase/Auth/fbAuthV2/fbSwitchUserRole';
import { fbGetBusinessesList } from '@/firebase/dev/businesses/fbGetBusinessesList';
import { db } from '@/firebase/firebaseconfig';
import type { CommandProcessorInterface } from '../types';

type ProductLookupRecord = Record<string, unknown> & {
  id: string;
  name?: string;
  displayName?: string;
  label?: string;
  productName?: string;
  description?: string;
  presentation?: string;
  brand?: string;
  brandName?: string;
  barcode?: string;
  sku?: string;
  code?: string;
  internalCode?: string;
  alternativeName?: string;
};

export const createDataLoaders = (processor: CommandProcessorInterface) => {
  const loadBusinessesList = async () => {
    try {
      const businessesList = await fbGetBusinessesList();
      processor.setBusinesses(businessesList);
      processor.businesses = businessesList;
      return businessesList;
    } catch (error) {
      console.error('Error al cargar negocios:', error);
      return [];
    }
  };

  const loadUsersList = async () => {
    try {
      const usersList = await fbGetUsers();
      // Users list processed
      console.log(usersList);
      return usersList;
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      return [];
    }
  };

  const loadProductsForLookup = async (): Promise<ProductLookupRecord[]> => {
    if (!processor.user?.businessID) {
      return [];
    }

    try {
      const productsRef = collection(
        db,
        'businesses',
        processor.user.businessID,
        'products',
      );
      const snapshot = await getDocs(productsRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Record<string, unknown>),
      })) as ProductLookupRecord[];
    } catch (error) {
      console.error(
        'Error al cargar productos para la consola de desarrollador:',
        error,
      );
      throw error;
    }
  };

  const findProductsByName = async (searchTerm: string) => {
    if (!searchTerm) return [];

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return [];

    const products = await loadProductsForLookup();

    const fieldMatchesTerm = (value: unknown) => {
      if (!value) return false;
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedSearch);
      }
      if (typeof value === 'object' && value !== null) {
        const record = value as { name?: unknown; label?: unknown };
        if (
          typeof record.name === 'string' &&
          record.name.toLowerCase().includes(normalizedSearch)
        ) {
          return true;
        }
        if (
          typeof record.label === 'string' &&
          record.label.toLowerCase().includes(normalizedSearch)
        ) {
          return true;
        }
      }
      return false;
    };

    return products.filter((product) => {
      const candidateValues = [
        product?.name,
        product?.displayName,
        product?.label,
        product?.productName,
        product?.description,
        product?.presentation,
        product?.brand,
        product?.brandName,
        product?.barcode,
        product?.sku,
        product?.code,
        product?.internalCode,
        product?.alternativeName,
      ];

      return candidateValues.some(fieldMatchesTerm);
    });
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    try {
      await fbUpdateUserPassword(userId, newPassword);
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  };

  const switchCurrentUserRole = async (targetRole: string) => {
    try {
      await fbSwitchUserRole(targetRole);
      return true;
    } catch (error) {
      console.error('Error al cambiar rol temporal:', error);
      throw error;
    }
  };

  const startBusinessImpersonation = async ({
    targetBusinessId,
    ttlMinutes,
  }: {
    targetBusinessId: string;
    ttlMinutes?: number;
  }) => {
    try {
      return await fbStartDeveloperBusinessImpersonation({
        targetBusinessId,
        ttlMinutes,
      });
    } catch (error) {
      console.error('Error al iniciar impersonación de negocio:', error);
      throw error;
    }
  };

  const stopBusinessImpersonation = async () => {
    try {
      return await fbStopDeveloperBusinessImpersonation();
    } catch (error) {
      console.error('Error al detener impersonación de negocio:', error);
      throw error;
    }
  };

  const getBusinessImpersonationStatus = async () => {
    try {
      return await fbGetDeveloperBusinessImpersonationStatus();
    } catch (error) {
      console.error('Error al consultar impersonación de negocio:', error);
      throw error;
    }
  };

  return {
    loadBusinessesList,
    loadUsersList,
    loadProductsForLookup,
    findProductsByName,
    changeUserPassword,
    switchCurrentUserRole,
    startBusinessImpersonation,
    stopBusinessImpersonation,
    getBusinessImpersonationStatus,
  };
};
