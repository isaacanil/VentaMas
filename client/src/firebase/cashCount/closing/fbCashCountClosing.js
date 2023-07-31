import { Timestamp, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebaseconfig'


// Función para cerrar un 'cashCount'
export const fbCashCountChangeState = async (cashCount, user, state) => {

  // Verificamos que el objeto 'user' y 'businessID' existen
  if (!user || !user?.businessID) { return null }

  // Creación de las referencias de los documentos de los usuarios


  // Creamos una referencia al documento 'cashCount' existente
  const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCount.id)

  // Intentamos actualizar el documento 'cashCount' en Firestore

  try {
    if (user?.uid === cashCount?.opening?.employee?.id || user.role === 'admin' || user.role === 'manager') {
      await updateDoc(cashCountRef, {
        'cashCount.state': state,
        'cashCount.updatedAt': Timestamp.fromMillis(Date.now()),
        'cashCount.stateHistory': arrayUnion({
          state: state,
          timestamp: Timestamp.fromMillis(Date.now()),
          updatedBy: user?.uid,
        }),
      })
      console.log('Cash count closing document successfully written!');
      return 'success'
    } else {
      throw new Error('User is not the employee who opened the cash count')
    }
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error
  }
}