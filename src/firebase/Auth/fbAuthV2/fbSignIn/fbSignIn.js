import { httpsCallable } from 'firebase/functions';

import { login } from "../../../../features/auth/userSlice";
import { functions } from '../../../firebaseconfig';

const clientLoginCallable = httpsCallable(functions, 'clientLogin');

const storeSessionLocally = ({ sessionToken, sessionExpiresAt }) => {
    if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
    }

    if (sessionExpiresAt) {
        localStorage.setItem('sessionExpires', sessionExpiresAt.toString());
    }
};

export function updateAppState(dispatch, userData) {
    dispatch(login({
        uid: userData.id,
        displayName: userData?.displayName || userData?.realName || userData?.name,
    }));
}

export const fbSignIn = async (user) => {
    try {
        const response = await clientLoginCallable({
            username: user.name,
            password: user.password,
        });

        const payload = response?.data || {};
        if (!payload.ok) {
            throw new Error(payload?.message || 'Error al iniciar sesión');
        }

        storeSessionLocally({
            sessionToken: payload.sessionToken,
            sessionExpiresAt: payload.sessionExpiresAt,
        });

        return payload.user;
    } catch (error) {
        throw new Error(error?.message || 'Error al iniciar sesión');
    }
};
