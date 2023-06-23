import { doc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import { hash } from "bcryptjs";
import { db } from "../../firebaseconfig";

// Función para verificar si el nombre de usuario ya existe
async function checkIfUserExists(name) {
    const userCollection = collection(db, "users");
    const nameQuery = query(userCollection, where("name", "==", name));
    const matchingUsersSnapshot = await getDocs(nameQuery);

    return !matchingUsersSnapshot.empty;
}

// Función para validar la entrada del usuario
function validateUserInput({ id, name, password, businessID, role }) {
    if(!id) { throw new Error('User ID is required'); }
    if(!name) { throw new Error('User name is required'); };
    if(!password) { throw new Error('Password is required') }
    if(!businessID) { throw new Error('Business ID is required') }
    if(!role) { throw new Error('Role is required') }
}

export const fbSignUp = async (userData) => {
    try {
        // Validar la entrada del usuario
        validateUserInput(userData);

        // Verificar si el nombre de usuario ya existe
        const userExists = await checkIfUserExists(userData.name);

        if (userExists) {
            throw new Error('A user with this name already exists');
        }

        // Hash password
        const hashedPassword = await hash(userData.password, 10);
        
        const userRef = doc(db, "users", userData.id);

        // Antes de almacenar, valida las entradas del usuario (esta es una versión simplificada)
        await setDoc(userRef, {
            user: {
                ...userData,
                password: hashedPassword,
                loginAttempts: 0,
                lockUntil: null,
            }
        });
        console.log('User created successfully');
    } catch (error) {
        // Maneja el error de forma segura
        console.error('An error occurred during sign up'); // No revela detalles del error
        console.error(error);
    }
};
