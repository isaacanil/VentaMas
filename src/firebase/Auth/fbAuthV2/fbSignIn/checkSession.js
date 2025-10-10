import { Modal } from 'antd';
import { getDoc, doc, deleteDoc, setDoc, collection, query, where, getDocs, Timestamp, serverTimestamp } from "firebase/firestore";
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { SESSION_DURATION, TOKEN_CLEANUP_AGE, INACTIVITY_WARNING, SESSION_CHECK_INTERVAL, ACTIVITY_CHECK_INTERVAL } from '../../../../constants/sessionConfig';
import { login, logout } from "../../../../features/auth/userSlice";
import { db } from "../../../firebaseconfig";

let lastActivity = Timestamp.now();
let isModalVisible = false;

function updateLastActivity() {
    lastActivity = Timestamp.now();
}

function generateNewSessionToken(userId) {
    const currentTime = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(currentTime.toMillis() + SESSION_DURATION);
    return {
        token: `${userId}_${currentTime.toMillis()}`,
        expiresAt
    };
}

const showSessionExpiredModal = (navigate) => {
    if (isModalVisible) return;
    isModalVisible = true;

    Modal.warning({
        title: 'Sesión Expirada',
        content: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        okText: 'Aceptar',
        onOk: () => {
            isModalVisible = false;
            navigate('/login', { replace: true });
        },
        afterClose: () => {
            isModalVisible = false;
        },
        centered: true,
        maskClosable: false,
        keyboard: false,
    });
};

const showInactivityWarningModal = async (sessionToken, dispatch, navigate) => {
    if (isModalVisible) return;
    isModalVisible = true;

    Modal.confirm({
        title: 'Inactividad Prolongada',
        content: '¿Deseas mantener tu sesión activa? Se cerrará en 5 días por inactividad.',
        okText: 'Sí, mantener activa',
        cancelText: 'No, cerrar sesión',
        centered: true,
        onCancel: async () => {
            if (sessionToken) {
                await deleteDoc(doc(db, 'sessionTokens', sessionToken));
            }
            localStorage.clear();
            dispatch(logout());
            navigate('/login', { replace: true });
        },
        afterClose: () => {
            isModalVisible = false;
        }
    });
};

const showSessionExpiringWarning = async (sessionToken, dispatch, navigate) => {
    if (isModalVisible) return;
    isModalVisible = true;

    Modal.confirm({
        title: 'Sesión por Expirar',
        content: 'Tu sesión expirará pronto.',
        okText: 'Entendido',
        cancelText: 'Cerrar sesión',
        centered: true,
        onCancel: async () => {
            await deleteDoc(doc(db, 'sessionTokens', sessionToken));
            localStorage.clear();
            dispatch(logout());
            navigate('/login', { replace: true });
        },
        afterClose: () => {
            isModalVisible = false;
        }
    });
};

const cleanupOldTokens = async (userId, currentToken) => {
    try {
        const tokensRef = collection(db, 'sessionTokens');
        const q = query(tokensRef, where("userId", "==", userId));
        const tokenSnapshots = await getDocs(q);
        
        const cleanupDate = Timestamp.fromMillis(Timestamp.now().toMillis() - TOKEN_CLEANUP_AGE);
        
        const deletePromises = tokenSnapshots.docs
            .filter(doc => {
                if (doc.id === currentToken) return false;
                const tokenData = doc.data();
                return !tokenData.expiresAt || tokenData.expiresAt.toMillis() < cleanupDate.toMillis();
            })
            .map(doc => deleteDoc(doc.ref));

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error limpiando tokens antiguos:', error);
    }
};

const migrateOldSession = async (oldSession, dispatch) => {
    if (!oldSession) return null;
    
    const oldUserData = JSON.parse(oldSession);
    if (!oldUserData?.uid) return null;

    await cleanupOldTokens(oldUserData.uid, null);
    
    const { token, expiresAt } = generateNewSessionToken(oldUserData.uid);
    // Usando serverTimestamp para createdAt
    await setDoc(doc(db, 'sessionTokens', token), { 
        userId: oldUserData.uid,
        expiresAt,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp() // Agregando lastActivity con serverTimestamp
    });
    
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('sessionExpires', expiresAt.toMillis().toString());
    localStorage.removeItem('user');
    
    const userSnapshot = await getDoc(doc(db, 'users', oldUserData.uid));
    if (userSnapshot.exists()) {
        const userData = userSnapshot.data().user;
        dispatch(login({
            uid: oldUserData.uid,
            displayName: userData?.realName || userData?.name,
            username: userData?.name,
            realName: userData?.realName,
        }));
    }
    
    return token;
};

const verifyAndUpdateSession = async (sessionToken, sessionExpires, dispatch, navigate) => {
    if (!sessionToken || !sessionExpires) {
        dispatch(logout());
        return;
    }

    const currentTime = Timestamp.now();
    const expirationTime = Timestamp.fromMillis(parseInt(sessionExpires));
    
    if (currentTime.toMillis() > expirationTime.toMillis()) {
        await deleteDoc(doc(db, 'sessionTokens', sessionToken));
        localStorage.clear();
        dispatch(logout());
        showSessionExpiredModal(navigate);
        return;
    }

    const sessionSnapshot = await getDoc(doc(db, 'sessionTokens', sessionToken));
    if (!sessionSnapshot.exists()) {
        localStorage.clear();
        dispatch(logout());
        return;
    }

    // Actualizar lastActivity en Firebase usando serverTimestamp
    await setDoc(doc(db, 'sessionTokens', sessionToken), {
        lastActivity: serverTimestamp()
    }, { merge: true });

    const sessionData = sessionSnapshot.data();
    const firebaseExpiresAt = sessionData.expiresAt;

    if (firebaseExpiresAt.toMillis() !== parseInt(sessionExpires)) {
        localStorage.setItem('sessionExpires', firebaseExpiresAt.toMillis().toString());
        
        if (currentTime.toMillis() > firebaseExpiresAt.toMillis() - (24 * 60 * 60 * 1000)) {
            await showSessionExpiringWarning(sessionToken, dispatch, navigate);
        }
    }

    const userId = sessionData.userId;
    await cleanupOldTokens(userId, sessionToken);

    const userSnapshot = await getDoc(doc(db, 'users', userId));
    const userData = userSnapshot?.data()?.user;
    
    dispatch(login({
        uid: userSnapshot?.id,
        displayName: userData?.realName || userData?.name,
        username: userData?.name,
        realName: userData?.realName,
    }));
};

const setupActivityListeners = (dispatch, navigate) => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
        window.addEventListener(event, updateLastActivity);
    });

    const activityCheck = setInterval(() => {
        const inactiveTime = Timestamp.now().toMillis() - lastActivity.toMillis();
        if (inactiveTime > INACTIVITY_WARNING) {
            const sessionToken = localStorage.getItem('sessionToken');
            showInactivityWarningModal(sessionToken, dispatch, navigate);
        }
    }, ACTIVITY_CHECK_INTERVAL);

    return { events, activityCheck };
};

export function useAutomaticLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const handleSession = async () => {
            try {
                const sessionToken = localStorage?.getItem('sessionToken');
                const sessionExpires = localStorage?.getItem('sessionExpires');
                const oldSession = localStorage?.getItem('user');

                if (oldSession && !sessionToken) {
                    await migrateOldSession(oldSession, dispatch);
                }

                await verifyAndUpdateSession(sessionToken, sessionExpires, dispatch, navigate);
                
            } catch (error) {
                console.error('Error en checkSession:', error);
                localStorage.clear();
                dispatch(logout());
                showSessionExpiredModal(navigate);
            }
        };

        handleSession();

        const checkInterval = setInterval(handleSession, SESSION_CHECK_INTERVAL);
        const { events, activityCheck } = setupActivityListeners(dispatch, navigate);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateLastActivity);
            });
            clearInterval(activityCheck);
            clearInterval(checkInterval);
        };
    }, []);

    return null;
}