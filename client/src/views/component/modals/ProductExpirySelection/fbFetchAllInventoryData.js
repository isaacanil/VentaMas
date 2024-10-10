import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../firebase/firebaseconfig";
import { selectUser } from "../../../../features/auth/userSlice";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const getPathIds = (path) => {
    if (typeof path !== 'string' || !path.trim()) return {};
    const ids = path.split('/').filter((id) => id !== '');
    return {
        warehouseId: ids[0] || null,
        shelfId: ids[1] || null,
        rowShelfId: ids[2] || null,
        segmentId: ids[3] || null,
    };
};
function getBatchIds(products) {
    if (!Array.isArray(products) || products.length === 0) {
        return []; // Devuelve un array vacío si el inventario es inválido o vacío
    }
    const batchIds = products.map(item => item.batchId);
    return [...new Set(batchIds)]; // Remove duplicate batch IDs
}
function transformInventoryItems(inventoryItems, data) {
    return inventoryItems.map(item => {
        const { warehouseId, shelfId, rowShelfId, segmentId } = getPathIds(item.path);

        // Variables para almacenar los nombres
        let warehouseName = '';
        let warehouseShortName = '';
        let shelfName = '';
        let rowName = '';
        let segmentName = '';

        // Obtener datos del almacén
        if (warehouseId) {
            const warehouse = data.warehouses.find(w => w.id === warehouseId || w.warehouseId === warehouseId);
            if (warehouse) {
                warehouseName = warehouse?.name || '';
                warehouseShortName = warehouse?.shortName || '';
            }
        }

        // Obtener datos de la estantería
        if (shelfId) {
            const shelf = data.shelves.find(s => s.id === shelfId || s.shelfId === shelfId);
            if (shelf) {
                shelfName = shelf?.shortName || '';
            }
        }

        // Obtener datos de la fila
        if (rowShelfId) {
            const row = data.rows.find(r => r.id === rowShelfId || r.rowShelfId === rowShelfId);
            if (row) {
                rowName = row?.shortName || '';
            }
        }

        // Obtener datos del segmento
        if (segmentId) {
            const segment = data.segments.find(s => s.id === segmentId || s.segmentId === segmentId);
            if (segment) {
                segmentName = segment?.shortName || '';
            }
        }

        // Obtener otros campos del item de inventario

        const expirationDate = item?.expirationDate || '';
        const batch ={
            id: item?.batchId || '',
        }
        const productStock = {
            id: item?.id || '',
            stock: item?.stock || 0,
        }
        const path = item?.path;
        

        // Retornar el objeto con la estructura deseada
        return {
            warehouse: warehouseName,
            shortName: warehouseShortName,
            shelf: shelfName,
            row: rowName,
            segment: segmentName,
            path: path,
            productStock,
            batch,
            expirationDate,
        };
    });
}
function saveBatchDataOnInventory(inventory, batches) {
    return inventory.map(item => {
        const batch = batches.find(b => b.id === item.batch.id);
   
        if (batch) {
            return {
                ...item,
                batch: {
                    id: batch.id,
                    shortName: batch.shortName,
                    expirationDate: batch.expirationDate,
                    stock: batch.quantity,
                }
            };
        }
        return item;
    });
}
function sortInventoryByLocation(inventoryItems) {
    return inventoryItems.sort((a, b) => {
        const locationA = buildLocationString(a).toLowerCase();
        const locationB = buildLocationString(b).toLowerCase();
        if (locationA < locationB) return -1;
        if (locationA > locationB) return 1;
        return 0;
    });
}
function buildLocationString(item) {
    let locationString = '';
    if (item.shortName) locationString += item.shortName;
    if (item.shelf) locationString += `-${item.shelf}`;
    if (item.row) locationString += `-${item.row}`;
    if (item.segment) locationString += `-${item.segment}`;
    return locationString;
}

export const fetchAllInventoryData = async (user, productId, setInventory) => {
    try {
        if (!user.businessID)  return;
        const productsStock = await fbGetProductsStock(user, productId);
        const paths = productsStock.map((product) => product?.path) || [];
        const pathIds = paths.map((path) => getPathIds(path))
        const { data } = await fbGetWarehouseData(user, pathIds);
        const batchIdsFromInventory = getBatchIds(productsStock);
        const batches = await fbGetBatchesByIds(user, batchIdsFromInventory);
        const inventoryItems = transformInventoryItems(productsStock, data);
        const inventory = saveBatchDataOnInventory(inventoryItems, batches);
        setInventory(sortInventoryByLocation(inventory));
        return sortInventoryByLocation(inventory);
    } catch (error) {
        console.error("ocurrió un error al buscar ......................", error)
    }
}

export const useGetAllInventoryData = (productId) => {
    const user = useSelector(selectUser);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {   
        if (user && productId) {
            fetchAllInventoryData(user, productId, setData)
                .then(() => setLoading(false))
                .catch((err) => setError(err));
        }
    }
    , [user, productId]);

    return { data, loading, error };
}
  


const fbGetProductsStock = async (user, productId) => {
    const productStockRef = collection(db, 'businesses', user.businessID, 'productsStock');
    const q = query(productStockRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    let data = [];
    querySnapshot.forEach((doc) => {
        data.push(doc.data());
    });
    return data;
}
const fbGetWarehouseData = async (user, items) => {
    if (!user.businessID || items.length === 0) {
        return {
            data: {
                warehouses: [],
                shelves: [],
                rows: [],
                segments: [],
            },
            loading: false,
            error: null,
        };
    }

    let warehouses = [];
    let shelves = [];
    let rows = [];
    let segments = [];
    let error = null;

    for (const item of items) {
        try {
            let docPath = `businesses/${user.businessID}/warehouses/${item.warehouseId}`;

            if (item.shelfId) {
                docPath += `/shelves/${item.shelfId}`;
                if (item.rowShelfId) {
                    docPath += `/rows/${item.rowShelfId}`;
                    if (item.segmentId) {
                        docPath += `/segments/${item.segmentId}`;
                    }
                }
            }

            const docRef = doc(db, docPath);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const docData = docSnap.data();
                if (item.segmentId) segments.push(docData);
                else if (item.rowShelfId) rows.push(docData);
                else if (item.shelfId) shelves.push(docData);
                else if (item.warehouseId) warehouses.push(docData);
            }
        } catch (err) {
            console.error("Error obteniendo el documento:", err);
            error = err;
        }
    }

    return {
        data: {
            warehouses,
            shelves,
            rows,
            segments,
        },
        loading: false,
        error,
    };
}
const fbGetBatchesByIds = async (user, batchIDs) => {
    const batchRefs = batchIDs.map((batchID) => doc(db, 'businesses', user.businessID, 'batches', batchID));
    const batchDocs = await Promise.all(batchRefs.map(async (batchRef) => {
        const docSnap = await getDoc(batchRef);
        return docSnap.data();
    }));
    return batchDocs;
}