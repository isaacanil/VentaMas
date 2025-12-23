import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { fbGetDocs } from '@/firebase/firebaseOperations';

export function useIsOpenCashReconciliation() {
  const [value, setValue] = useState(false);
  const [_cashReconciliation, _setCashReconciliation] = useState(null);
  const user = useSelector(selectUser);
  const _dispatch = useDispatch();

  useEffect(() => {
    if (!user || !user?.businessID) {
      return;
    }
    const cashReconciliationRef = collection(
      db,
      'businesses',
      user?.businessID,
      'cashCounts',
    );
    const q = query(
      cashReconciliationRef,
      where('cashCount.state', 'in', ['open', 'closing']),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const isOpen = querySnapshot.docs.some(
          (doc) => doc.data().cashCount.state === 'open',
        );
        const isEmpty = querySnapshot.empty;
        const isClosing = querySnapshot.docs.some(
          (doc) => doc.data().cashCount.state === 'closing',
        );
        const isSameUser = querySnapshot.docs.some(
          (doc) => doc.data().cashCount.opening.employee.id === user.uid,
        );
        const isOpenForUser = querySnapshot.docs.some((doc) => {
          const { cashCount } = doc.data();
          return (
            cashCount.state === 'open' &&
            cashCount.opening.employee.id === user.uid
          );
        });
        const isClosingForUser = querySnapshot.docs.some((doc) => {
          const { cashCount } = doc.data();
          return (
            cashCount.state === 'closing' &&
            cashCount.opening.employee.id === user.uid
          );
        });
        if (isEmpty) {
          setValue('none'); // o 'empty' o null, lo que prefieras
          return;
        }
        if (isOpenForUser) {
          setValue('open');
        } else if (isClosingForUser || isClosing) {
          setValue('closing');
        } else if (isOpen || isSameUser) {
          setValue('closed');
        } else {
          setValue('closed');
        }
      },
      (error) => {
        console.error('Error en la suscripción a Firestore: ', error);
        // Aquí podrías establecer algún estado para manejar este error en la UI si lo necesitas.
      },
    );

    // Cuando el componente se desmonta, cancela la suscripción
    return () => unsubscribe();
  }, [user]);

  return { status: value, cashCount: _cashReconciliation };
}

export async function checkOpenCashReconciliation(user) {
  try {
    if (!user || !user.businessID || !user.uid) {
      throw new Error('Datos del usuario incompletos');
    }
    const employeeRef = doc(db, 'users', user.uid);

    const cashReconciliationRef = collection(
      db,
      'businesses',
      user.businessID,
      'cashCounts',
    );

    const q = query(
      cashReconciliationRef,
      where('cashCount.state', 'in', ['open', 'closing']),
      where('cashCount.opening.employee', '==', employeeRef),
    );

    const querySnapshot = await fbGetDocs(q);

    if (querySnapshot.empty) {
      return { state: 'none', cashCount: null };
    }
    const cashCountOpen = (doc) => doc.data().cashCount.state === 'open';
    const cashCountClosing = (doc) => doc.data().cashCount.state === 'closing';

    const cashCountDoc = querySnapshot.docs.find(
      (doc) => cashCountOpen(doc) || cashCountClosing(doc),
    );

    if (!cashCountDoc) {
      return { state: 'closed', cashCount: null };
    }

    if (cashCountOpen(cashCountDoc)) {
      return { state: 'open', cashCount: cashCountDoc.data().cashCount };
    } else if (cashCountClosing(cashCountDoc)) {
      return { state: 'closing', cashCount: cashCountDoc.data().cashCount };
    } else {
      return { state: 'closed', cashCount: null };
    }
  } catch (error) {
    console.error('Error al consultar Firestore: ', error);
    throw error; // Re-lanza el error para manejarlo más adelante si es necesario
  }
}
