import { Timestamp, doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebaseconfig'
import { nanoid } from 'nanoid'
import { getNextID } from '../../Tools/getNextID'

export const fbCashCountOpening = async (user, cashCount, employeeID, approvalEmployeeID, openingDate) => {

  if (!user || !user?.businessID) { return null }

  const userRefPath = doc(db, 'users', employeeID);
  const approvalEmployeeRefPath = doc(db, `users`, approvalEmployeeID);

  const id = nanoid(10)
  const incrementNumber = await getNextID(user, 'lastCashCountId');

  cashCount = {
    ...cashCount,
    id: id,
    incrementNumber: incrementNumber,
  }
  
  const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', id)

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
    return 'success'
  } catch (error) {
    console.error('Error writing cash count opening document: ', error);
    return error
  }
}