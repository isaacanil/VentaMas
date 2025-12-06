import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { filter } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { SelectSettingCart } from '../../features/cart/cartSlice';
import {
  SelectActiveIngredients,
  SelectCategories,
  SelectCategoryStatus,
} from '../../features/category/categorySlicer';
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
} from '../../features/filterProduct/filterProductsSlice';
import { getTax } from '../../utils/pricing';
import { db } from '../firebaseconfig';

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
  serverApplied = {},
) {
  // Filtro por Inventariable
  if (!serverApplied.inventariable) {
    if (inventariable === 'si') {
      productsArray = filter(
        productsArray,
        (product) => product.trackInventory === true,
      );
    } else if (inventariable === 'no') {
      productsArray = filter(
        productsArray,
        (product) => product.trackInventory === false,
      );
    }
  }

  // Filtro por ITBIS
  if (!serverApplied.itbis && itbis !== 'todos') {
    const itbisValue = normalizeTaxValue(itbis);
    if (itbisValue !== null) {
      productsArray = filter(productsArray, (product = {}) => {
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
      productsArray = filter(productsArray, (product) => {
        const price = Number(product?.pricing?.price ?? 0);
        return !Number.isFinite(price) || price <= 0;
      });
    } else if (priceStatus === 'conPrecio') {
      productsArray = filter(productsArray, (product) => {
        const price = Number(product?.pricing?.price ?? 0);
        return Number.isFinite(price) && price > 0;
      });
    }
  }

  // Filtro por estado de costo
  if (!serverApplied.costStatus) {
    if (costStatus === 'sinCosto') {
      productsArray = filter(productsArray, (product) => {
        const cost = Number(product?.pricing?.cost ?? 0);
        return !Number.isFinite(cost) || cost <= 0;
      });
    } else if (costStatus === 'conCosto') {
      productsArray = filter(productsArray, (product) => {
        const cost = Number(product?.pricing?.cost ?? 0);
        return Number.isFinite(cost) && cost > 0;
      });
    }
  }

  // Filtro por promociones
  if (!serverApplied.promotionStatus) {
    if (promotionStatus === 'promocionActiva') {
      productsArray = filter(
        productsArray,
        (product) => product?.promotions?.isActive === true,
      );
    } else if (promotionStatus === 'sinPromocion') {
      productsArray = filter(
        productsArray,
        (product) => product?.promotions?.isActive !== true,
      );
    }
  }

  // Filtro disponibilidad de stock
  if (stockAvailability === 'conStock') {
    productsArray = filter(
      productsArray,
      (product) => (product.stock ?? 0) > 0,
    );
  } else if (stockAvailability === 'sinStock') {
    productsArray = filter(
      productsArray,
      (product) => (product.stock ?? 0) === 0,
    );
  }

  // Filtro por requerimiento de stock
  // Campo fuente: product.restrictSaleWithoutStock (boolean)
  //  - true  => El producto NO se puede vender si no hay stock ("requiere")
  //  - false | undefined => El producto permite vender sin stock ("noRequiere")
  if (!serverApplied.stockRequirement) {
    if (stockRequirement === 'requiere') {
      productsArray = filter(
        productsArray,
        (product) => product.restrictSaleWithoutStock === true,
      );
    } else if (stockRequirement === 'noRequiere') {
      productsArray = filter(
        productsArray,
        (product) => product.restrictSaleWithoutStock !== true,
      ); // false o undefined
    }
  }

  // Filtro por nivel de alerta de stock (usa thresholds dinámicos)
  if (stockAlertLevel !== 'todos') {
    const { lowThreshold, criticalThreshold } = thresholds || {};
    const low = Number.isFinite(lowThreshold) ? lowThreshold : 20;
    const critical = Number.isFinite(criticalThreshold)
      ? criticalThreshold
      : Math.min(low, 10);

    productsArray = filter(productsArray, (product) => {
      if (!product.trackInventory) return stockAlertLevel === 'normal'; // Productos sin control se consideran 'normal'
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

export function useGetProducts(
  trackInventory = false,
  contextKey = DEFAULT_FILTER_CONTEXT,
) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
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
  const [stockIndexVersion, setStockIndexVersion] = useState(0);
  const [visibleStockTotal, setVisibleStockTotal] = useState(0);
  const warehouseStockIndexRef = useRef({});
  const processedProductsRef = useRef(null);

  useEffect(() => {
    warehouseStockIndexRef.current = warehouseStockIndex;
  }, [warehouseStockIndex]);

  // Thresholds desde billing settings
  const settingsCart = useSelector(SelectSettingCart);
  const billing = settingsCart?.billing || {}; // reutilizamos estructura existente
  const thresholds = {
    lowThreshold: Number.isFinite(billing?.stockLowThreshold)
      ? billing.stockLowThreshold
      : 20,
    criticalThreshold: Number.isFinite(billing?.stockCriticalThreshold)
      ? billing.stockCriticalThreshold
      : Math.min(
          Number.isFinite(billing?.stockLowThreshold)
            ? billing.stockLowThreshold
            : 20,
          10,
        ),
  };

  const activeIngredients = useSelector(SelectActiveIngredients);
  const categories = useSelector(SelectCategories);

  const categoriesStatus = useSelector(SelectCategoryStatus);

  useEffect(() => {
    if (!stockFilterActive) {
      setWarehouseStockIndex({});
      setStockIndexReady(true);
      setStockIndexVersion((prev) => prev + 1);
      return;
    }

    if (!user?.businessID) return;

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

    setWarehouseStockIndex({});
    setStockIndexReady(false);
    setVisibleStockTotal(0);

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
          setStockIndexVersion((prev) => prev + 1);
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
      const stockIndex = warehouseStockIndexRef.current || {};
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
      const baseMapper = (product) => withStock(product, resolveBaseStock(product));

      if (!stockFilterActive || sanitizedSelected.length === 0) {
        return base.map(baseMapper);
      }

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
    [stockFilterActive, stockIndexReady, selectedWarehouses],
  );

  const updateFilteredProducts = useCallback(
    (baseProducts) => {
      const source = Array.isArray(baseProducts)
        ? baseProducts
        : Array.isArray(processedProductsRef.current)
          ? processedProductsRef.current
          : [];
      const result = applyLocationFilter(source);
      if (result === null) {
        setLoading(true);
        return;
      }
      setProducts(result);
      const total = result.reduce(
        (sum, product) => sum + (Number(product?.stock ?? 0) || 0),
        0,
      );
      setVisibleStockTotal(total);
      setLoading(false);
    },
    [applyLocationFilter],
  );

  const updateFilteredProductsRef = useRef(updateFilteredProducts);

  useEffect(() => {
    updateFilteredProductsRef.current = updateFilteredProducts;
  }, [updateFilteredProducts]);

  useEffect(() => {
    if (!user || !user?.businessID) return;
    try {
      setLoading(true);
      const productsRef = collection(
        db,
        'businesses',
        String(user?.businessID),
        'products',
      );

      const constraints = [];
      const serverAppliedFilters = {
        inventariable: false,
        itbis: false,
        priceStatus: false,
        costStatus: false,
        promotionStatus: false,
        stockRequirement: false,
      };
      let inequalityField = null;
      const inequalityOperators = new Set([
        '<',
        '<=',
        '>',
        '>=',
        '!=',
        'not-in',
      ]);
      const tryAddConstraint = (field, operator, value) => {
        if (inequalityOperators.has(operator)) {
          if (inequalityField && inequalityField !== field) {
            return false;
          }
          inequalityField = field;
        }
        constraints.push(where(field, operator, value));
        return true;
      };

      const categoriesNameArray = categories.map((item) => item.name);
      if (categories.length > 0 && categoriesStatus) {
        constraints.push(where('category', 'in', categoriesNameArray));
      }
      const activeIngredientsNameArray = activeIngredients.map(
        (item) => item.name,
      );
      if (activeIngredients.length > 0) {
        constraints.push(
          where('activeIngredients', 'in', activeIngredientsNameArray),
        );
      }

      if (inventariable === 'si') {
        if (tryAddConstraint('trackInventory', '==', true)) {
          serverAppliedFilters.inventariable = true;
        }
      } else if (inventariable === 'no') {
        if (tryAddConstraint('trackInventory', '==', false)) {
          serverAppliedFilters.inventariable = true;
        }
      }

      if (itbis !== 'todos') {
        const normalizedItbis = normalizeTaxValue(itbis);
        if (
          normalizedItbis !== null &&
          tryAddConstraint('pricing.tax', '==', normalizedItbis)
        ) {
          serverAppliedFilters.itbis = true;
        }
      }

      if (priceStatus === 'conPrecio') {
        if (tryAddConstraint('pricing.price', '>', 0)) {
          serverAppliedFilters.priceStatus = true;
        }
      }

      if (costStatus === 'conCosto') {
        if (tryAddConstraint('pricing.cost', '>', 0)) {
          serverAppliedFilters.costStatus = true;
        }
      }

      if (promotionStatus === 'promocionActiva') {
        if (tryAddConstraint('promotions.isActive', '==', true)) {
          serverAppliedFilters.promotionStatus = true;
        }
      }

      if (stockRequirement === 'requiere') {
        if (tryAddConstraint('restrictSaleWithoutStock', '==', true)) {
          serverAppliedFilters.stockRequirement = true;
        }
      }

      const q = query(productsRef, ...constraints);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setProducts([]);
          setVisibleStockTotal(0);
          setLoading(false);
          return;
        }
        let productsArray = snapshot.docs.map((item) => {
          let doc = item.data();
          delete doc?.updatedAt;
          delete doc?.createdAt;
          delete doc?.createdBy;
          return doc;
        });

        productsArray = filterProducts(
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
          serverAppliedFilters,
        );
        productsArray = orderingProducts(productsArray, criterio, orden);

        productsArray = productsArray.sort((a, _b) =>
          a?.custom === true ? -1 : 1,
        );

        processedProductsRef.current = productsArray;
        if (typeof updateFilteredProductsRef.current === 'function') {
          updateFilteredProductsRef.current(productsArray);
        }
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      setLoading(false);
      setError(error);
      console.error('Ocurrió un error al obtener los productos:', error);
    }
  }, [
    user?.businessID,
    trackInventory,
    categories,
    activeIngredients,
    categoriesStatus,
    criterio,
    orden,
    inventariable,
    itbis,
    priceStatus,
    costStatus,
    promotionStatus,
    stockAvailability,
    stockAlertLevel,
    stockRequirement,
    billing?.stockLowThreshold,
    billing?.stockCriticalThreshold,
    contextKey,
  ]);

  useEffect(() => {
    if (!Array.isArray(processedProductsRef.current)) return;
    updateFilteredProducts();
  }, [updateFilteredProducts, stockIndexVersion]);

  const stockMeta = useMemo(
    () => ({
      filterActive: stockFilterActive,
      selectedWarehouses,
      stockIndexReady,
      visibleStockTotal,
    }),
    [stockFilterActive, selectedWarehouses, stockIndexReady, visibleStockTotal],
  );

  return { products, error, loading, setLoading, stockMeta };
}
