import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"
import { db } from "../firebaseconfig"
import { collection, query, orderBy, where, onSnapshot, limit } from "firebase/firestore"
import { useEffect, useState } from "react"
import { SelectCategoryList, SelectCategoryStatus } from "../../features/category/categorySlicer"
import { selectCriterio, selectInventariable, selectItbis, selectOrden } from "../../features/filterProduct/filterProductsSlice"
import { filter } from "lodash"
import { getTax } from "../../utils/pricing"


function filterProducts(productsArray, inventariable, itbis) {
  // Filtro por Inventariable
  if (inventariable === 'si') {
    productsArray = filter(productsArray, product => product.product.trackInventory === true);
  } else if (inventariable === 'no') {
    productsArray = filter(productsArray, product => product.product.trackInventory === false);
  }

  // Filtro por ITBIS
  if (itbis !== 'todos') {
    const itbisValue = parseFloat(itbis);
    productsArray = filter(productsArray, product => product.pricing.tax === itbisValue);
  }

  return productsArray;
}
function orderingProducts(productsArray, criterio, orden) {
  const handleOrdering = (field, order) => {
    if (field === 'tax') {
      productsArray.sort((a, b) => {
        const taxA = getTax(a.product.pricing.price, a.product.pricing.tax);
        const taxB = getTax(b.product.pricing.price, b.product.pricing.tax);
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
    }

    else {
      const fields = field.split('.'); // Divide el campo usando el punto

      productsArray.sort((a, b) => {
        let valueA = a;
        let valueB = b;

        // Accede a las propiedades anidadas usando los fragmentos
        fields.forEach(f => {
          valueA = valueA[f];
          valueB = valueB[f];
        });


        if (order === 'asc') return (valueA > valueB ? 1 : -1);
        if (order === 'desc') return (valueA < valueB ? 1 : -1);
        if (order === 'ascNum') return valueA - valueB; // Para ascendente
        if (order === 'descNum') return valueB - valueA; // Para descendente
        if (order === true) return (valueA === true ? -1 : 1);
        if (order === false) return (valueA === true ? 1 : -1);
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

export function useGetProducts(trackInventory = false) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const user = useSelector(selectUser);

  const criterio = useSelector(selectCriterio);
  const orden = useSelector(selectOrden);

  const inventariable = useSelector(selectInventariable)
  const itbis = useSelector(selectItbis)

  const categoriesArray = useSelector(SelectCategoryList);
  const categoriesStatus = useSelector(SelectCategoryStatus)

  useEffect(() => {
    if (!user || !user?.businessID) return;
    try {
      setLoading(true)
      const productsRef = collection(db, "businesses", String(user?.businessID), "products");

      const constraints = [];

      if (categoriesArray.length > 0 && categoriesStatus) {
        constraints.push(where("category", "in", categoriesArray));
      }

      const q = query(productsRef, ...constraints);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setProducts([]);
          setLoading(false);
          return;
        }
        let productsArray = snapshot.docs.map((item) => {
          let doc = item.data();
          delete doc?.product?.updatedAt;
          delete doc?.product?.createdAt;
          delete doc?.product?.createdBy;
          return doc
        }
        );


        // productsArray = filterProducts(productsArray, inventariable, itbis);
        // productsArray = orderingProducts(productsArray, criterio, orden);

        setProducts(productsArray);
        setLoading(false)
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      setLoading(false)
      setError(error);
      console.error("Ocurrió un error al obtener los productos:", error);
    }

  }, [user?.businessID, trackInventory, categoriesArray, categoriesStatus, criterio, orden, inventariable, itbis]);

  return { products, error, loading, setLoading };
}