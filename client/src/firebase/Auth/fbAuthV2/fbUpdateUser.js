import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import { compare, hash } from "bcryptjs";
import { fbCheckIfUserExists } from "./fbCheckIfUserExists";

export const fbUpdateUser = async (userData) => {
    userData = {
        ...userData,
        updatedAt: Timestamp.now()
    }
    const userExists = await fbCheckIfUserExists(userData?.name);

    if (userExists) {
        throw new Error('Error: Ya existe un usuario con este nombre.');
      
    }
    // Obtener referencia al usuario en la base de datos
    const userRef = doc(db, "users", userData?.id);

    // Actualizar la información del usuario
    await updateDoc(userRef, { user: userData });
}

async function hashPassword(password) {
    const saltRounds = 10; // Puedes ajustar este valor según tus necesidades
    const hashedPassword = await hash(password, saltRounds);
    return hashedPassword;
}

export const fbUpdateUserPassword = async (uid, oldPassword, newPassword) => {
    console.log(uid, oldPassword, newPassword)
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);
    const userData = userSnapshot.data().user;
    const userPassword = userData.password;

    // Verificar que la contraseña antigua sea correcta
    const isOldPasswordCorrect = await compare(oldPassword, userPassword);

    if (!isOldPasswordCorrect) {
        throw new Error("La contraseña antigua no es correcta");
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar la contraseña del usuario
    try {
        await updateDoc(userRef, {
            "user.password": hashedPassword
        });
        console.log("User password updated successfully");
    } catch (error) {
        console.log("Error updating user password", error);
    }
}
