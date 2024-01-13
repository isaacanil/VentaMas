import { getDocs, updateDoc, where, collection, query, setDoc, doc, increment } from "firebase/firestore";
import { hash, compare } from 'bcryptjs';
import { db } from "../../../firebaseconfig";
import { login } from "../../../../features/auth/userSlice";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

function generateSessionToken(user) {
    return `${user.name}_${Date.now()}`;
}

async function getUserFromFirestore(user) {
    const userRef = collection(db, "users");
    const q = query(userRef, where("user.name", "==", user.name));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) { throw new Error('Error: No se encontró el usuario')}

    return userSnapshot.docs[0];
}

async function checkLock(userData, currentTime) {
    if (userData.lockUntil && currentTime < userData.lockUntil) {
        throw new Error('This account has been temporarily locked due to too many failed login attempts. Please try again later.');
    }
}

async function checkPassword(user, userData) {
    const correctPassword = await compare(user.password, userData.password);

    if (!correctPassword) {
        throw new Error('Error: Contraseña incorrecta')
    }
    
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

async function storeSessionToken(user, userDoc) {
    const sessionToken = generateSessionToken(user);
    await setDoc(doc(db, 'sessionTokens', sessionToken), { userId: userDoc.id });
    localStorage.setItem('sessionToken', sessionToken);
}

async function updateAppState(dispatch, userData, userDoc) {
    dispatch(login({
        uid: userDoc.id,
        displayName: userData.name,

    }));
}

export const fbSignIn = async (user, dispatch, navigate, homePath) => {
    try {
        const userDoc = await getUserFromFirestore(user);
        const userData = userDoc.data().user;
        const currentTime = Date.now();

        checkLock(userData, currentTime);

        const correctPassword = await checkPassword(user, userData);

        await updateLoginAttempts(userDoc, userData, correctPassword, currentTime);

        await storeSessionToken(user, userDoc);

        await updateAppState(dispatch, userData, userDoc);

        navigate(homePath);

        console.log('User logged in successfully');

    } catch (error) {
        throw new Error(error.message);
    }
};
