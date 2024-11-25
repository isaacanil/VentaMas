import { Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebaseconfig'

export const fbCashCountClosed = async (user, cashCount, employeeID, approvalEmployeeID, closingDate) => {
  if (!user || !user?.businessID) { return null }

  const userRefPath = doc(db, 'users', employeeID);
  const approvalEmployeeRefPath = doc(db, `users`, approvalEmployeeID);

  const cashCountRef = doc(db, 'businesses', user?.businessID, 'cashCounts', cashCount.id)

  try {
    await updateDoc(cashCountRef, {
      'cashCount.state': 'closed',
      'cashCount.closing': {
        ...cashCount.closing,
        employee: userRefPath,
        approvalEmployee: approvalEmployeeRefPath,
        initialized: true,
        date: Timestamp.fromMillis(closingDate)
      },
      'cashCount.totalCard': cashCount?.totalCard,
      'cashCount.totalTransfer': cashCount?.totalTransfer,
      'cashCount.totalCharged': cashCount?.totalCharged,
      'cashCount.totalDiscrepancy': cashCount?.totalDiscrepancy,
      'cashCount.totalRegister': cashCount?.totalRegister,
      'cashCount.totalSystem': cashCount?.totalSystem
    })
    return 'success'
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error
  }
}