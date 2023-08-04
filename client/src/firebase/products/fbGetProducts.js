import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"
import { db } from "../firebaseconfig"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { SelectCategoryList, SelectCategoryStatus } from "../../features/category/categorySlicer"
import { selectCriterio, selectInventariable, selectItbis, selectOrden } from "../../features/filterProduct/filterProductsSlice"

export function useGetProducts(trackInventory = false) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const user = useSelector(selectUser);

  const criterio = useSelector(selectCriterio);
  const orden = useSelector(selectOrden);

  const inventariable = useSelector(selectInventariable)
  const itbis = useSelector(selectItbis)

  const categoriesArray = useSelector(SelectCategoryList);
  const categoriesStatus = useSelector(SelectCategoryStatus)

  useEffect(() => {
    setLoading(true)
    if (!user || !user?.businessID) {
      return;
    }

    //const productsRef = collection(db,`businesses/${user.businessID}/products`);
    const productsRef = collection(db, "businesses", String(user?.businessID), "products");

    //filtros por defecto
    const constraints = [];
    constraints.push(orderBy("product.productName", "asc"));
    /*--------------------------------------------------------------------------------------------- */
    if (trackInventory) {
      constraints.push(where("product.trackInventory", "==", true));
    }
    if (categoriesArray.length > 0 && categoriesStatus) {
      constraints.push(where("product.category", "in", categoriesArray));
    }
    /*----------------------------------------------------------------------------------------------- */
    const q = query(productsRef, ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProducts([]);
        setLoading(false);
        return;
      }
      let productsArray = snapshot.docs.map((item) => item.data());

      // Filtro por Inventariable
      if (inventariable === 'si') {
        productsArray = productsArray.filter(product => product.product.trackInventory === true);
      } else if (inventariable === 'no') {
        productsArray = productsArray.filter(product => product.product.trackInventory === false);
      }

      // Filtro por ITBIS
      if (itbis !== 'todos') {
        const itbisValue = parseFloat(itbis);
        productsArray = productsArray.filter(product => product.product.tax.value === itbisValue);
      } else if(itbis === '0') {
        productsArray = productsArray.filter(product => product.product.tax.value === 0);
      } else if(itbis === '0.16') {
        productsArray = productsArray.filter(product => product.product.tax.value === 0.16);
      } else if(itbis === '0.18') {
        productsArray = productsArray.filter(product => product.product.tax.value === 0.18);
      }

      const handleOrdering = (field, order) => {
        if (field === 'tax.value') {
          productsArray.sort((a, b) => {
            const taxA = a.product.price.unit * (1 + a.product.tax.value);
            const taxB = b.product.price.unit * (1 + b.product.tax.value);
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
            let valueA = a.product;
            let valueB = b.product;

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


      if (criterio === 'nombre') handleOrdering('productName', orden);
      if (criterio === 'inventariable') handleOrdering('trackInventory', orden);
      if (criterio === 'precio') handleOrdering('price.unit', orden);
      if (criterio === 'costo') handleOrdering('cost.unit', orden);
      if (criterio === 'stock') handleOrdering('stock', orden);
      if (criterio === 'categoria') handleOrdering('category', orden);
      if (criterio === 'impuesto') handleOrdering('tax.value', orden);

      setProducts(productsArray);
      setLoading(false)
    });

    return () => {
      unsubscribe();
    };
  }, [user?.businessID, trackInventory, categoriesArray, categoriesStatus, criterio, orden, inventariable, itbis]);

  return { products, loading, setLoading };
}