import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebaseconfig';

const clientValidateUserCallable = httpsCallable(functions, 'clientValidateUser');

export const fbValidateUser = async (user, uid) => {
    try {
        const response = await clientValidateUserCallable({
            username: user?.name,
            password: user?.password,
            uid,
        });

        const data = response?.data || {};
        return {
            userData: {
                uid: data?.userId || uid || null,
                ...data?.user,
            },
            response: { error: null },
        };
    } catch (error) {
        const message = error?.message || 'Error verificando usuario';
        return {
            userData: { uid: uid || null },
            response: { error: message },
        };
    }
};
