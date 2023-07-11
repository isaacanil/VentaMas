import { getDocs, where, collection, query } from "firebase/firestore";
import { compare } from 'bcryptjs';
import { db } from "../../../firebaseconfig";

async function getUserFromFirestore(user) {
    const userRef = collection(db, "users");
    const q = query(userRef, where("user.name", "==", user.name));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
        //throw new Error('Authentication failed');
        throw new Error('Usuario no encontrado');
    }

    return userSnapshot.docs[0];
}

async function checkPassword(user, userData) {
    const correctPassword = await compare(user.password, userData.password);

    if (!correctPassword) {
        //throw new Error('Authentication failed');
        throw new Error('Contraseña incorrecta');
    }

    return correctPassword;
}

export const fbValidateUser = async (user, uid) => {
    let response = { error: null };
    try {
        const userDoc = await getUserFromFirestore(user);
        const userData = userDoc.data().user;

        const correctPassword = await checkPassword(user, userData);
        uid = userDoc.id;


    } catch (error) {
        console.error('An error occurred during user validation');

        response.error = error.message;
    }
    return{userData: {uid}, response}
};
