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
                        displayName: userData.name 
                    }));
                } else {
                    dispatch(logout());
                    console.log('User data deleted');
                }
            });

            return () => unsubscribe();
        }
    }, [userId]);
}
