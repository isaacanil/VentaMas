import { collection, doc, getDocs } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbGetUserWithId = async (userId) => {
    const userRef = doc(db, "users")
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
        return userSnap.data()
    } else {
        return null
    }
}
//la estructura de los usuarios en la base de datso es un doc que tiene user y luego dentro tiene las propiedades ejemplo para el negocio seria "user.businessID" user es un objeto en el doc ten lo pendiente

const id = 'TRNykpxKa580PqGc0GtI' //negocio de los usuarios que necesito

export async function fbGetUser() {
    const usuariosColeccion = collection(db, 'users');
    const snapshot = await getDocs(usuariosColeccion);
    const listaUsuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return listaUsuarios;
  }