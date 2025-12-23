import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import {
  SelectActiveIngredients,
  SelectCategories,
  SelectCategoryStatus,
} from '@/features/category/categorySlicer';
import {
  DEFAULT_FILTER_CONTEXT,
  selectCriterio,
  selectInventariable,
  selectItbis,
  selectPriceStatus,
  selectCostStatus,
  selectPromotionStatus,
  selectOrden,
  selectStockAvailability,
  selectStockAlertLevel,
  selectStockRequirement,
  selectStockLocations,
} from '@/features/filterProduct/filterProductsSlice';
import { getTax } from '@/utils/pricing';
import { db } from '@/firebase/firebaseconfig';

const normalizeTaxValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const scaled = Math.abs(numeric) < 1 ? numeric * 100 : numeric;
  return Math.round(scaled * 100) / 100;
};

function filterProducts(
  productsArray,
  inventariable,
  itbis,
  priceStatus,
  costStatus,
  promotionStatus,
  stockAvailability,
  stockAlertLevel,
  stockRequirement,
  thresholds,
  categories,
  activeIngredients,
  categoriesStatus,
  serverApplied = {},
) {
  // Filtro por Inventariable
  if (!serverApplied.inventariable) {
    if (inventariable === 'si') {
      productsArray = productsArray.filter(
        (product) => product.trackInventory === true,
      );
    } else if (inventariable === 'no') {
      productsArray = productsArray.filter(
        (product) => product.trackInventory === false,
      );
    }
  }

  // Filtro por ITBIS
  if (!serverApplied.itbis && itbis !== 'todos') {
    const itbisValue = normalizeTaxValue(itbis);
    if (itbisValue !== null) {
      productsArray = productsArray.filter((product = {}) => {
        const { pricing = {} } = product;
        const normalizedTax = normalizeTaxValue(pricing.tax);
        if (normalizedTax === null) return false;
        return normalizedTax === itbisValue;
      });
    }
  }

  // Filtro por estado de precio
  if (!serverApplied.priceStatus) {
    if (priceStatus === 'sinPrecio') {
      productsArray = productsArray.filter((product) => {
        const price = Number(product?.pricing?.price ?? 0);
        return !Number.isFinite(price) || price <= 0;
      });
    } else if (priceStatus === 'conPrecio') {
      productsArray = productsArray.filter((product) => {
        const price = Number(product?.pricing?.price ?? 0);
        return Number.isFinite(price) && price > 0;
      });
    }
  }

  // Filtro por estado de costo
  if (!serverApplied.costStatus) {
    if (costStatus === 'sinCosto') {
      productsArray = productsArray.filter((product) => {
        const cost = Number(product?.pricing?.cost ?? 0);
        return !Number.isFinite(cost) || cost <= 0;
      });
    } else if (costStatus === 'conCosto') {
      productsArray = productsArray.filter((product) => {
        const cost = Number(product?.pricing?.cost ?? 0);
        return Number.isFinite(cost) && cost > 0;
      });
    }
  }

  // Filtro por promociones
  if (!serverApplied.promotionStatus) {
    if (promotionStatus === 'promocionActiva') {
      productsArray = productsArray.filter(
        (product) => product?.promotions?.isActive === true,
      );
    } else if (promotionStatus === 'sinPromocion') {
      productsArray = productsArray.filter(
        (product) => product?.promotions?.isActive !== true,
      );
    }
  }

  // Filtro disponibilidad de stock
  if (!serverApplied.stockAvailability) {
    if (stockAvailability === 'conStock') {
      productsArray = productsArray.filter(
        (product) => (product.stock ?? 0) > 0,
      );
    } else if (stockAvailability === 'sinStock') {
      productsArray = productsArray.filter(
        (product) => (product.stock ?? 0) === 0,
      );
    }
  }

  // Filtro por requerimiento de stock
  if (!serverApplied.stockRequirement) {
    if (stockRequirement === 'requiere') {
      productsArray = productsArray.filter(
        (product) => product.restrictSaleWithoutStock === true,
      );
    } else if (stockRequirement === 'noRequiere') {
      productsArray = productsArray.filter(
        (product) => product.restrictSaleWithoutStock !== true,
      );
    }
  }

  // Filtro por nivel de alerta de stock
  if (stockAlertLevel !== 'todos') {
    const { lowThreshold, criticalThreshold } = thresholds || {};
    const low = Number.isFinite(lowThreshold) ? lowThreshold : 20;
    const critical = Number.isFinite(criticalThreshold)
      ? criticalThreshold
      : Math.min(low, 10);

    productsArray = productsArray.filter((product) => {
      if (!product.trackInventory) return stockAlertLevel === 'normal';
      const stock = product.stock ?? 0;
      if (stock <= 0) {
        return stockAlertLevel === 'critico';
      }
      if (stock > 0 && stock <= critical) {
        return stockAlertLevel === 'critico';
      }
      if (stock > critical && stock <= low) {
        return stockAlertLevel === 'bajo';
      }
      if (stock > low) {
        return stockAlertLevel === 'normal';
      }
      return true;
    });
  }

  // Filtro por Categoria
  if (categories.length > 0 && categoriesStatus) {
    const categoriesNameArray = categories.map((item) => item.name);
    productsArray = productsArray.filter((product) =>
      categoriesNameArray.includes(product.category),
    );
  }

  // Filtro por Ingredientes Activos
  if (activeIngredients.length > 0) {
    const activeIngredientsNameArray = activeIngredients.map(
      (item) => item.name,
    );
    productsArray = productsArray.filter((product) =>
      activeIngredientsNameArray.includes(product.activeIngredients),
    );
  }

  return productsArray;
}
function orderingProducts(productsArray, criterio, orden) {
  const handleOrdering = (field, order) => {
    if (field === 'tax') {
      productsArray.sort((a, b) => {
        const taxA = getTax(a.pricing.price, a.pricing.tax);
        const taxB = getTax(b.pricing.price, b.pricing.tax);
        if (order === 'ascNum') {
          if (taxA === 0) return 1;
          if (taxB === 0) return -1;
          return taxA - taxB; // Para ascendente
        }
        if (order === 'descNum') {
          if (taxA === 0) return 1;
          if (taxB === 0) return -1;
          return taxB - taxA; // Para descendente
        }
        return 0; // Retorna 0 si no hay condiciones de ordenamiento para este caso
      });
    } else {
      const fields = field.split('.'); // Divide el campo usando el punto

      productsArray.sort((a, b) => {
        let valueA = a;
        let valueB = b;

        // Accede a las propiedades anidadas usando los fragmentos
        fields.forEach((f) => {
          valueA = valueA[f];
          valueB = valueB[f];
        });

        if (order === 'asc') return valueA > valueB ? 1 : -1;
        if (order === 'desc') return valueA < valueB ? 1 : -1;
        if (order === 'ascNum') return valueA - valueB; // Para ascendente
        if (order === 'descNum') return valueB - valueA; // Para descendente
        if (order === true) return valueA === true ? -1 : 1;
        if (order === false) return valueA === true ? 1 : -1;
      });
    }
  };

  if (criterio === 'nombre') handleOrdering('name', orden);
  if (criterio === 'inventariable') handleOrdering('trackInventory', orden);
  if (criterio === 'precio') handleOrdering('pricing.price', orden);
  if (criterio === 'costo') handleOrdering('pricing.cost', orden);
  if (criterio === 'stock') handleOrdering('stock', orden);
  if (criterio === 'categoria') handleOrdering('category', orden);
  if (criterio === 'impuesto') handleOrdering('pricing.tax', orden);

  return productsArray;
}

// Obtener todos los productos de la colección 'products'
export const fbGetProducts = async (user) => {
  try {
    if (!user?.businessID || typeof user.businessID != 'string') return [];
    const productsRef = collection(
      db,
      'businesses',
      user.businessID,
      'products',
    );
    const snapshot = await getDocs(productsRef);
    const allProducts = snapshot.docs.map((doc) => doc.data());
    return allProducts;
  } catch (error) {
    console.error('Error al obtener todos los productos:', error);
    throw error;
  }
};

export function useGetProducts(contextKey = DEFAULT_FILTER_CONTEXT) {
  const [loading, setLoading] = useState(true);
  const [rawProducts, setRawProducts] = useState([]); // Productos sin filtrar desde Firebase
  const [error, setError] = useState(null);

  const user = useSelector(selectUser);

  const criterio = useSelector((state) => selectCriterio(state, contextKey));
  const orden = useSelector((state) => selectOrden(state, contextKey));

  const inventariable = useSelector((state) =>
    selectInventariable(state, contextKey),
  );
  const itbis = useSelector((state) => selectItbis(state, contextKey));
  const priceStatus = useSelector((state) =>
    selectPriceStatus(state, contextKey),
  );
  const costStatus = useSelector((state) =>
    selectCostStatus(state, contextKey),
  );
  const promotionStatus = useSelector((state) =>
    selectPromotionStatus(state, contextKey),
  );
  const stockAvailability = useSelector((state) =>
    selectStockAvailability(state, contextKey),
  );
  const stockAlertLevel = useSelector((state) =>
    selectStockAlertLevel(state, contextKey),
  );
  const stockRequirement = useSelector((state) =>
    selectStockRequirement(state, contextKey),
  );
  const stockLocations = useSelector((state) =>
    selectStockLocations(state, contextKey),
  );
  const selectedWarehouses = useMemo(
    () =>
      Array.isArray(stockLocations)
        ? [...new Set(stockLocations.filter(Boolean))]
        : [],
    [stockLocations],
  );
  const stockFilterActive = selectedWarehouses.length > 0;

  const [warehouseStockIndex, setWarehouseStockIndex] = useState({});
  const [stockIndexReady, setStockIndexReady] = useState(false);

  // Thresholds desde billing settings
  const settingsCart = useSelector(SelectSettingCart);
  const billing = settingsCart?.billing || {}; // reutilizamos estructura existente
  const stockLowThreshold = billing?.stockLowThreshold;
  const stockCriticalThreshold = billing?.stockCriticalThreshold;

  const thresholds = useMemo(() => ({
    lowThreshold: Number.isFinite(stockLowThreshold)
      ? stockLowThreshold
      : 20,
    criticalThreshold: Number.isFinite(stockCriticalThreshold)
      ? stockCriticalThreshold
      : Math.min(
        Number.isFinite(stockLowThreshold)
          ? stockLowThreshold
          : 20,
        10,
      ),
  }), [stockLowThreshold, stockCriticalThreshold]);

  const activeIngredients = useSelector(SelectActiveIngredients);
  const categories = useSelector(SelectCategories);

  const categoriesStatus = useSelector(SelectCategoryStatus);

  const [prevBusinessID, setPrevBusinessID] = useState(user?.businessID);
  const [prevStockFilterActive, setPrevStockFilterActive] = useState(stockFilterActive);

  // PATRÓN RECOMENDADO REACT: Resetear estado durante render al cambiar dependencias

  // 1. Reset loading si cambia el negocio
  if (user?.businessID !== prevBusinessID) {
    setPrevBusinessID(user?.businessID);
    setLoading(true);
  }

  // 2. Reset stock state si cambia el filtro activo
  if (stockFilterActive !== prevStockFilterActive) {
    setPrevStockFilterActive(stockFilterActive);
    // Si se desactiva, ready = true. Si se activa, ready = false (esperando carga)
    setStockIndexReady(!stockFilterActive);
    setWarehouseStockIndex({});
  }

  // Lógica de stock por almacenes (sin cambios mayores, solo integración)
  useEffect(() => {
    if (!stockFilterActive) {
      return undefined;
    }

    if (!user?.businessID) return undefined;

    const stockRef = collection(
      db,
      'businesses',
      String(user.businessID),
      'productsStock',
    );
    const warehouseDocsMap = {};
    const warehouseLoaded = {};
    const expectedWarehouses = selectedWarehouses.length;
    let isMounted = true;

    const unsubscribes = selectedWarehouses.map((warehouseId) => {
      const lowerBound = warehouseId;
      const upperBound = `${warehouseId}\uf8ff`;
      const locationQuery = query(
        stockRef,
        where('location', '>=', lowerBound),
        where('location', '<', upperBound),
        where('isDeleted', '==', false),
        where('status', '==', 'active'),
      );

      return onSnapshot(
        locationQuery,
        (snapshot) => {
          if (!isMounted) return;
          warehouseDocsMap[warehouseId] = snapshot.docs.map((doc) =>
            doc.data(),
          );
          warehouseLoaded[warehouseId] = true;
          const aggregatedMap = {};
          Object.entries(warehouseDocsMap).forEach(
            ([currentWarehouseId, docs]) => {
              docs.forEach((docData) => {
                const productId = docData?.productId;
                if (!productId) return;
                const quantity = Number(docData?.quantity) || 0;
                if (quantity <= 0) return;
                if (!aggregatedMap[productId]) {
                  aggregatedMap[productId] = {};
                }
                aggregatedMap[productId][currentWarehouseId] =
                  (aggregatedMap[productId][currentWarehouseId] || 0) +
                  quantity;
              });
            },
          );
          setWarehouseStockIndex(aggregatedMap);
          const allReady =
            expectedWarehouses > 0
              ? Object.keys(warehouseLoaded).length >= expectedWarehouses
              : true;
          setStockIndexReady(allReady);
        },
        (error) => {
          console.error('Error al escuchar stock filtrado por almacén:', error);
          if (isMounted) {
            setStockIndexReady(true);
          }
        },
      );
    });

    return () => {
      isMounted = false;
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
    };
  }, [user?.businessID, stockFilterActive, selectedWarehouses]);

  const applyLocationFilter = useCallback(
    (sourceProducts = []) => {
      const base = Array.isArray(sourceProducts) ? sourceProducts : [];
      const stockIndex = warehouseStockIndex || {};
      const sanitizedSelected = Array.isArray(selectedWarehouses)
        ? selectedWarehouses.filter(Boolean)
        : [];
      const resolveBaseStock = (product) => {
        const declaredStock = Number(product?.stock);
        if (Number.isFinite(declaredStock)) {
          return declaredStock;
        }
        const declaredOriginal = Number(product?.originalStock);
        return Number.isFinite(declaredOriginal) ? declaredOriginal : 0;
      };
      const withStock = (product, stockValue) => ({
        ...product,
        stock: stockValue,
      });
      const baseMapper = (product) =>
        withStock(product, resolveBaseStock(product));

      if (!stockFilterActive || sanitizedSelected.length === 0) {
        return base.map(baseMapper);
      }

      // Si no tenemos index listo, devolvemos null para indicar loading o base vacía?
      // Mejor devolver null para indicar que espere
      if (!stockIndexReady) return null;

      const result = [];
      for (const product of base) {
        const stockByLocation = stockIndex?.[product.id] || {};
        const scopedStock = sanitizedSelected.reduce(
          (sum, locationId) => sum + Number(stockByLocation?.[locationId] || 0),
          0,
        );

        if (scopedStock <= 0) continue;

        result.push(withStock(product, scopedStock));
      }

      return result;
    },
    [stockFilterActive, stockIndexReady, selectedWarehouses, warehouseStockIndex],
  );

  // 1. Obtener TODOS los productos (Listener principal)
  useEffect(() => {
    if (!user || !user?.businessID) return undefined;

    const productsRef = collection(
      db,
      'businesses',
      String(user?.businessID),
      'products',
    );

    const q = query(productsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setRawProducts([]);
          setLoading(false);
          return;
        }
        const productsArray = snapshot.docs.map((item) => {
          const doc = item.data();
          if (doc) {
            const { updatedAt: _, createdAt: __, createdBy: ___, ...cleanDoc } = doc;
            return cleanDoc;
          }
          return doc;
        });

        setRawProducts(productsArray);
        setLoading(false);
      },
      (err) => {
        console.error('Ocurrió un error al obtener los productos:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.businessID, user]);

  // 2. Derivar processedData usando useMemo en lugar de useEffect
  const processedData = useMemo(() => {
    // Si está cargando rawProducts (primera vez), devolver vacío
    if (loading && rawProducts.length === 0) {
      return { products: [], total: 0 };
    }

    let processed = [...rawProducts];

    // Aplicar filtro de stock por almacén primero (si aplica)
    // Si retorna null es que faltan datos de stock
    const locationFiltered = applyLocationFilter(processed);
    if (locationFiltered === null) {
      return { products: [], total: 0 };
    }
    processed = locationFiltered;

    // Aplicar filtros de negocio
    processed = filterProducts(
      processed,
      inventariable,
      itbis,
      priceStatus,
      costStatus,
      promotionStatus,
      stockAvailability,
      stockAlertLevel,
      stockRequirement,
      thresholds,
      categories,
      activeIngredients,
      categoriesStatus,
      {}, // No serverApplied
    );

    // Ordenar
    processed = orderingProducts(processed, criterio, orden);

    // Ordenar custom al final (lógica original)
    processed = processed.sort((a) => (a?.custom === true ? -1 : 1));

    // Calcular totales visibles
    const total = processed.reduce(
      (sum, product) => sum + (Number(product?.stock ?? 0) || 0),
      0,
    );

    return { products: processed, total };
  }, [
    rawProducts,
    loading,
    applyLocationFilter,
    inventariable,
    itbis,
    priceStatus,
    costStatus,
    promotionStatus,
    stockAvailability,
    stockAlertLevel,
    stockRequirement,
    categories,
    activeIngredients,
    categoriesStatus,
    criterio,
    orden,
    thresholds,
  ]);

  // Derivar loading final
  // Estamos cargando si:
  // 1. El fetch inicial de products está en proceso (loading state)
  // 2. El filtro de stock está activo pero el index no está listo
  const isStockLoading = stockFilterActive && !stockIndexReady;
  const derivedLoading = loading || isStockLoading;

  const stockMeta = useMemo(
    () => ({
      filterActive: stockFilterActive,
      selectedWarehouses,
      stockIndexReady,
      visibleStockTotal: processedData.total,
    }),
    [stockFilterActive, selectedWarehouses, stockIndexReady, processedData.total],
  );

  return { products: processedData.products, error, loading: derivedLoading, setLoading, stockMeta };
}
