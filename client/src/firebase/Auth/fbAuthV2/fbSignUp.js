import { doc, setDoc, getDocs, query, collection, where, Timestamp } from "firebase/firestore";
import { hash } from "bcryptjs";
import { db } from "../../firebaseconfig";
import { nanoid } from "nanoid";

// Función para verificar si el nombre de usuario ya existe
export async function checkIfUserExists(name) {
    const userCollection = collection(db, "users");
    const nameQuery = query(userCollection, where("user.name", "==", name));
    const matchingUsersSnapshot = await getDocs(nameQuery);

    return !matchingUsersSnapshot.empty;
}

// Función para validar la entrada del usuario
function validateUserInput({ id, name, password, businessID, role }) {
    if(!name) { throw new Error('Error: Es obligatorio proporcionar un nombre de usuario.'); };
    if(!password) { throw new Error('Error: Es obligatorio proporcionar una contraseña.') }
    if(!businessID) { throw new Error('Error: Es obligatorio proporcionar un ID de negocio.') }
    if(!role) { throw new Error('Error: Es obligatorio seleccionar un rol.') }
}

export const fbSignUp = async (userData) => {
        validateUserInput(userData);
   
        userData.id = nanoid(10);

        const userExists = await checkIfUserExists(userData.name);

        if (userExists) {
            throw new Error('Error: Ya existe un usuario con este nombre.');
        }

        const hashedPassword = await hash(userData.password, 10);
        
        const userRef = doc(db, "users", userData.id);

        await setDoc(userRef, {
            user: {
                ...userData,
                name: userData.name.toLowerCase(),
                password: hashedPassword,
                active: true,
                createAt: Timestamp.now(),
                loginAttempts: 0,
                lockUntil: null,
            }
        });
};
