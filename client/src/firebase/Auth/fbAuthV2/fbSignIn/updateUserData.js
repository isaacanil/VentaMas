import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../firebaseconfig';
import { login, logout } from '../../../../features/auth/userSlice';

export function useUserDocListener(userId) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (userId) {
            const unsubscribe = onSnapshot(doc(db, 'users', userId), (userSnapshot) => {
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data().user;
                    dispatch(login({
                        uid: userSnapshot.id,
                        displayName: userData.name // Ajusta según tu estructura.
                    }));
                    console.log('User data updated', userData);
                } else {
                    dispatch(logout());
                    console.log('User data deleted');
                }
            });

            // Devolver una función de limpieza para desuscribirse de onSnapshot
            return () => unsubscribe();
        }
    }, [userId]);
}
