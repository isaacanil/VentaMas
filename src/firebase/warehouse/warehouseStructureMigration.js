import { doc, writeBatch, getDoc } from 'firebase/firestore';

import { db } from '../firebaseconfig';

import { getAllRowShelves } from './RowShelfService';
import { getAllSegments } from './segmentService';
import { getShelves } from './shelfService';
import { getWarehouses } from './warehouseService';

const createStructureDocument = async (businessId, type) => {
  const structureRef = doc(db, 'businesses', businessId, 'warehouseStructure', type);
  const docSnap = await getDoc(structureRef);
  if (!docSnap.exists()) {
    await setDoc(structureRef, { elements: {} });
  }
};

export const migrateToStructure = async (user) => {
  try {
    // Crear documentos de estructura si no existen
    await Promise.all([
      createStructureDocument(user.businessID, 'warehouses'),
      createStructureDocument(user.businessID, 'shelves'),
      createStructureDocument(user.businessID, 'rows'),
      createStructureDocument(user.businessID, 'segments')
    ]);

    // Obtener todos los datos existentes
    const warehouses = await getWarehouses(user);
    const batch = writeBatch(db);

    for (const warehouse of warehouses) {
      // Migrar almacén
      const warehouseRef = doc(db, 'businesses', user.businessID, 'warehouseStructure', 'warehouses');
      batch.update(warehouseRef, {
        [`elements.${warehouse.id}`]: {
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.id,
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid,
          isDeleted: warehouse.isDeleted || false
        }
      });

      // Obtener y migrar estantes del almacén
      const shelves = await getShelves(user, warehouse.id);
      const shelvesRef = doc(db, 'businesses', user.businessID, 'warehouseStructure', 'shelves');
      
      for (const shelf of shelves) {
        batch.update(shelvesRef, {
          [`elements.${shelf.id}`]: {
            id: shelf.id,
            name: shelf.name,
            location: `${warehouse.id}/${shelf.id}`,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid,
            isDeleted: shelf.isDeleted || false
          }
        });

        // Obtener y migrar filas del estante
        const rows = await getAllRowShelves(user, warehouse.id, shelf.id);
        const rowsRef = doc(db, 'businesses', user.businessID, 'warehouseStructure', 'rows');

        for (const row of rows) {
          batch.update(rowsRef, {
            [`elements.${row.id}`]: {
              id: row.id,
              name: row.name,
              location: `${warehouse.id}/${shelf.id}/${row.id}`,
              updatedAt: new Date().toISOString(),
              updatedBy: user.uid,
              isDeleted: row.isDeleted || false
            }
          });

          // Obtener y migrar segmentos de la fila
          const segments = await getAllSegments(user, warehouse.id, shelf.id, row.id);
          const segmentsRef = doc(db, 'businesses', user.businessID, 'warehouseStructure', 'segments');

          for (const segment of segments) {
            batch.update(segmentsRef, {
              [`elements.${segment.id}`]: {
                id: segment.id,
                name: segment.name,
                location: `${warehouse.id}/${shelf.id}/${row.id}/${segment.id}`,
                updatedAt: new Date().toISOString(),
                updatedBy: user.uid,
                isDeleted: segment.isDeleted || false
              }
            });
          }
        }
      }

      // Commit cada 500 operaciones para evitar límites de Firestore
      if (batch._mutations.length >= 400) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }

    // Commit final de las operaciones restantes
    if (batch._mutations.length > 0) {
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error('Error en la migración:', error);
    throw error;
  }
};

// Hook para ejecutar la migración
export const useMigrateStructure = () => {
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState(null);
  const user = useSelector(selectUser);

  const executeMigration = async () => {
    if (!user?.businessID) return;
    
    try {
      setMigrating(true);
      await migrateToStructure(user);
      setMigrating(false);
    } catch (err) {
      setError(err);
      setMigrating(false);
    }
  };

  return { executeMigration, migrating, error };
};
