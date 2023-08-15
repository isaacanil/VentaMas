import { useMemo } from 'react';
import _ from 'lodash';


export const useCompareArrays = (array1, array2) => {
  return useMemo(() => {
    // Si los arreglos tienen longitudes diferentes, no son iguales
    if (array1.length !== array2.length) return false;

    // Compara cada par de objetos en los arreglos
    for (let i = 0; i < array1.length; i++) {
      if (!_.isEqual(array1[i], array2[i])) return false;
    }

    return true;
  }, [array1, array2]); // Recalculará solo si alguno de los arreglos cambia
}
