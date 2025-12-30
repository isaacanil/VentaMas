import { collection, getDocs } from 'firebase/firestore';
import { fbGetUsers } from '@/firebase/Auth/fbAuthV2/fbGetUsers';
import { fbUpdateUserPassword } from '@/firebase/Auth/fbAuthV2/fbUpdateUserPassword';
import { fbGetBusinessesList } from '@/firebase/dev/businesses/fbGetBusinessesList';
import { db } from '@/firebase/firebaseconfig';

export const createDataLoaders = (processor) => {
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

  const loadProductsForLookup = async () => {
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
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(
        'Error al cargar productos para la consola de desarrollador:',
        error,
      );
      throw error;
    }
  };

  const findProductsByName = async (searchTerm) => {
    if (!searchTerm) return [];

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return [];

    const products = await loadProductsForLookup();

    const fieldMatchesTerm = (value) => {
      if (!value) return false;
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedSearch);
      }
      if (typeof value === 'object' && value !== null) {
        if (
          typeof value.name === 'string' &&
          value.name.toLowerCase().includes(normalizedSearch)
        ) {
          return true;
        }
        if (
          typeof value.label === 'string' &&
          value.label.toLowerCase().includes(normalizedSearch)
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

  const changeUserPassword = async (userId, newPassword) => {
    try {
      await fbUpdateUserPassword(userId, newPassword);
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  };

  return {
    loadBusinessesList,
    loadUsersList,
    loadProductsForLookup,
    findProductsByName,
    changeUserPassword,
  };
};
