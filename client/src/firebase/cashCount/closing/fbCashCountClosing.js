import { Timestamp, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebaseconfig'

export const fbCashCountChangeState = async (cashCount, user, state) => {

  if (!user || !user?.businessID) { return null }

  const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCount.id)

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
      return 'success'
    } else {
      throw new Error('User is not the employee who opened the cash count')
    }
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error
  }
}