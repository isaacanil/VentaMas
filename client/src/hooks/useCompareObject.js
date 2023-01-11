import { useEffect, useMemo, useState } from 'react';

// export const useCompareObjects = (obj1, obj2) => {
//   const isEqual = useMemo(() => {
//     const keys1 = Object.keys(obj1).sort();
//     const keys2 = Object.keys(obj2).sort();

//     if (keys1.length !== keys2.length) return false;

//     return keys1.every((key, index) => obj1[key] === obj2[keys2[index]]);
//   }, [obj1, obj2]);

//   return isEqual;
// }


// export const useCompareObjects = (obj1, obj2) => {
//   const [areEqual, setAreEqual] = useState(false);

//   useEffect(() => {
//     setAreEqual(JSON.stringify(obj1) === JSON.stringify(obj2));
//   }, [object1, object2]);

//   return areEqual;
// }

// export const useCompareObjects = (obj1, obj2) => {
//   const [areEqual, setAreEqual] = useState(false);
//   useEffect(() => {
//     if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
//       setAreEqual(false)
//     }
//     if (Object.keys(obj1).length && Object.keys(obj2).length) {
//       setAreEqual(JSON.stringify(obj1) === JSON.stringify(obj2));
//     } else {
//       setAreEqual(false);
//     }
//   }, [obj1, obj2]);
//   console.log(areEqual, 'from compare')
//   return areEqual;
// }

export function useCompareObjects(obj1, obj2) {
  if (obj1 === obj2) return true; // Si los objetos son el mismo objeto, devuelve verdadero

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false; // Si uno de los objetos no es un objeto, devuelve falso

  const obj1Keys = Object.keys(obj1); // Obtiene las claves de obj1
  const obj2Keys = Object.keys(obj2); // Obtiene las claves de obj2

  if (obj1Keys.length !== obj2Keys.length) return false; // Si los objetos tienen diferente cantidad de claves, devuelve falso

  for (const key of obj1Keys) { // Itera a través de cada clave de obj1
    if (!obj2Keys.includes(key)) return false; // Si obj2 no tiene la clave, devuelve falso

    if (!useCompareObjects(obj1[key], obj2[key])) return false; // Si los valores de las claves no son iguales, devuelve falso
  }
  return true; // Si todas las comparaciones anteriores son verdaderas, devuelve verdadero
}


export const useCompareObjectsInState = (obj1, obj2) => {
  let areEqual = false;
    if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
      areEqual = false
    }
    if (Object.keys(obj1).length && Object.keys(obj2).length) {
      areEqual = JSON.stringify(obj1) === JSON.stringify(obj2);

    } else {
      areEqual = false
    }
 
  console.log(areEqual, 'from compare')
  return areEqual;
}