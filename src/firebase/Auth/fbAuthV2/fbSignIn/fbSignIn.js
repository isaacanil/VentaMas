import { getDocs, updateDoc, where, collection, query, setDoc, doc, increment, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { hash, compare } from 'bcryptjs';
import { db } from "../../../firebaseconfig";
import { login } from "../../../../features/auth/userSlice";
import { SESSION_DURATION, TOKEN_CLEANUP_AGE } from '../../../../constants/sessionConfig';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

function generateSessionToken(user) {
    const currentTime = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(currentTime.toMillis() + SESSION_DURATION);
    return {
        token: `${user.name}_${currentTime.toMillis()}`,
        expiresAt
    };
}

async function getUserFromFirestore(user) {
    const userRef = collection(db, "users");
    const q = query(userRef, where("user.name", "==", user.name));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) { throw new Error('Error: No se encontró el usuario') }

    return userSnapshot.docs[0];
}

async function checkLock(userData, currentTime) {
    if (userData.lockUntil && currentTime < userData.lockUntil) {
        throw new Error('This account has been temporarily locked due to too many failed login attempts. Please try again later.');
    }
}

async function checkPassword(user, userData) {
    const correctPassword = await compare(user.password, userData.password);

    if (!correctPassword)
        throw new Error('Error: Contraseña incorrecta');

    return correctPassword;
}

async function updateLoginAttempts(userDoc, userData, correctPassword, currentTime) {
    let updates = correctPassword
        ? { "user.loginAttempts": 0, "user.lockUntil": null }
        : { "user.loginAttempts": increment(1) };

    if (!correctPassword && userData.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        updates["user.lockUntil"] = currentTime + LOCK_TIME;
    }

    await updateDoc(userDoc.ref, updates);
}

async function cleanupOldTokens(userId) {
    try {
        const tokensRef = collection(db, 'sessionTokens');
        const q = query(tokensRef, where("userId", "==", userId));
        const tokenSnapshots = await getDocs(q);

        const cleanupDate = Timestamp.fromMillis(Timestamp.now().toMillis() - TOKEN_CLEANUP_AGE);

        const deletePromises = tokenSnapshots.docs
            .filter(doc => {
                const tokenData = doc.data();
                return !tokenData.expiresAt || tokenData.expiresAt.toMillis() < cleanupDate.toMillis();
            })
            .map(doc => deleteDoc(doc.ref));

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error limpiando tokens antiguos:', error);
    }
}

async function storeSessionToken(user, userDoc) {
    const currentTime = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(currentTime.toMillis() + SESSION_DURATION);
    const token = `${user.name}_${currentTime.toMillis()}`;

    await cleanupOldTokens(userDoc.id);

    await setDoc(doc(db, 'sessionTokens', token), {
        userId: userDoc.id,
        expiresAt,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
    });

    localStorage.setItem('sessionToken', token);
    localStorage.setItem('sessionExpires', expiresAt.toMillis().toString());
}

export function updateAppState(dispatch, userData) {
    dispatch(login({
        uid: userData.id,
        displayName: userData.name,
    }));
}

export const fbSignIn = async (user) => {
    try {
        const userDoc = await getUserFromFirestore(user);
        const userData = userDoc.data().user;
        const currentTime = Date.now();

        checkLock(userData, currentTime);

        const correctPassword = await checkPassword(user, userData);

        await updateLoginAttempts(userDoc, userData, correctPassword, currentTime);

        await storeSessionToken(user, userDoc);

        return userData;

    } catch (error) {
        throw new Error(error.message);
    }
};