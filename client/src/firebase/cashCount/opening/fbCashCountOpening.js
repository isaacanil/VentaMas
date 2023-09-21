import { Timestamp, doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebaseconfig'
import { nanoid } from 'nanoid'
import { getNextID } from '../../Tools/getNextID'

// Función para abrir un nuevo 'cashCount'
export const fbCashCountOpening = async (user, cashCount, employeeID, approvalEmployeeID, openingDate) => {

  // Verificamos que el objeto 'user' y 'businessID' existen
  if (!user || !user?.businessID) { return null }

  // Creación de las referencias de los documentos de los usuarios
  const userRefPath = doc(db, 'users', employeeID);
  const approvalEmployeeRefPath = doc(db, `users`, approvalEmployeeID);

  // Generamos un nuevo ID
  const id = nanoid(10)
  const incrementNumber = await getNextID(user, 'lastCashCountId');

  // Creamos un nuevo 'cashCount' extendiendo el original con los nuevos IDs y número de incremento
  cashCount = {
    ...cashCount,
    id: id,
    incrementNumber: incrementNumber,
  }
  

  // Creamos una referencia al documento 'cashCount'
  const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', id)

  // Intentamos escribir el documento 'cashCount' en Firestore
  try {
    await setDoc(cashCountRef, {
      cashCount: {
        ...cashCount,
        createdAt: Timestamp.fromMillis(Date.now()),
        updatedAt: Timestamp.fromMillis(Date.now()),
        state: 'open',
        opening: {
          ...cashCount.opening,
          employee: userRefPath,
          approvalEmployee: approvalEmployeeRefPath,
          initialized: true,
          date: Timestamp.fromMillis(openingDate)
        }
      }
    })
    console.log('Cash count opening document successfully written!');
    return 'success'
  } catch (error) {
    console.error('Error writing cash count opening document: ', error);
    return error
  }
}