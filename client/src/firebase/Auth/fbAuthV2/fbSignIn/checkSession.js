import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../firebaseconfig";
import { login, logout } from "../../../../features/auth/userSlice";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

export function useAutomaticLogin() {
    const dispatch = useDispatch();

    useEffect(() => {
        const sessionToken = localStorage?.getItem('sessionToken');

        if (sessionToken) {
            (async () => {
                try {
                    const sessionSnapshot = await getDoc(doc(db, 'sessionTokens', sessionToken));
                    const userId = sessionSnapshot?.data()?.userId;
                    const userSnapshot = await getDoc(doc(db, 'users', userId));
                    const userData = userSnapshot?.data()?.user;
                    const username = userData?.realName ? userData?.realName : userData?.name;

                    dispatch(login({
                        uid: userSnapshot?.id,
                        displayName: username,
                        username: userData?.name,
                        realName: userData?.realName,
                    }));
     
                } catch (error) {
                    dispatch(logout())
                }
            })();
        }else{
            dispatch(logout())
        }
    }, []);
}