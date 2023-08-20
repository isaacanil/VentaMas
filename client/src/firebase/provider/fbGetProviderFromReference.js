import { getDoc } from "firebase/firestore";

export const fbGetDocFromReference = async (ref) => {
    try {
      
      let doc = (await getDoc(ref)).data(); // Intenta obtener el documento a partir de la referencia
  
      if (doc) { // Si el documento existe
        return doc; // Retorna el documento
      } else {
        console.log("No such document!");
        return null; // Retorna nulo si no existe el documento
      }
    } catch (error) { // Si hay un error en la promesa
      console.error("Hubo un error al obtener el documento:", error);
      return null; // Retorna nulo en caso de error
    }
  }
  