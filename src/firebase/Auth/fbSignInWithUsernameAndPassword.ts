import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

interface UserCredentialsDoc {
  email: string;
  password: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUserCredentialsDoc = (value: unknown): value is UserCredentialsDoc => {
  if (!isRecord(value)) return false;
  return typeof value.email === 'string' && typeof value.password === 'string';
};

export async function authenticateUser(
  username: string,
  password: string,
): Promise<void> {
  // Obtén el documento del usuario de Firestore
  const userDoc = await getDoc(doc(db, 'users', username));
  if (!userDoc.exists()) {
    throw new Error('Usuario no encontrado');
  }

  // Comprueba la contraseña...
  // Esto debería hacerse con una función de comparación de contraseñas encriptadas, no en texto plano.
  const data = userDoc.data();
  if (!isUserCredentialsDoc(data)) {
    throw new Error('Usuario sin credenciales válidas');
  }
  if (data.password !== password) {
    throw new Error('Contraseña incorrecta');
  }

  // Si la contraseña es correcta, inicia sesión en Firebase con el correo electrónico y la contraseña del usuario
  await signInWithEmailAndPassword(auth, data.email, password);
}
