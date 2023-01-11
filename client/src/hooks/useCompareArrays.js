import { useEffect, useState } from "react"



export const useCompareArrays = (array1, array2) => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (array1.length !== array2.length) {
      setResult(false);
      return;
    }
    let isEqual = true;
    for (let i = 0; i < array1.length; i++) {
      if (Object.keys(array1[i]).length !== Object.keys(array2[i]).length) {
        isEqual = false;
        break;
      }
      for (let key in array1[i]) {
        if (array1[i][key] !== array2[i][key]) {
          isEqual = false;
          break;
        }
      }
    }
    setResult(isEqual);
  }, [array1, array2]);

  return result;
}
