import { Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebaseconfig'


// Función para cerrar un 'cashCount'
export const fbCashCountClosed = async (user, cashCount, employeeID, approvalEmployeeID, closingDate) => {
  
  // Verificamos que el objeto 'user' y 'businessID' existen
  if (!user || !user?.businessID) { return null }

  // Creación de las referencias de los documentos de los usuarios
  const userRefPath = doc(db, 'users', employeeID);
  const approvalEmployeeRefPath = doc(db, `users`, approvalEmployeeID);

  // Creamos una referencia al documento 'cashCount' existente
  const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCount.id)

  // Intentamos actualizar el documento 'cashCount' en Firestore
  try {
    await updateDoc(cashCountRef, {
      'cashCount.state': 'closed',
      'cashCount.closing': {
        ...cashCount.closing,
        employee: userRefPath,
        approvalEmployee: approvalEmployeeRefPath,
        initialized: true,
        date: Timestamp.fromMillis(closingDate)
      }
    })
    console.log('Cash count closing document successfully written!');
    return 'success'
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error
  }
}