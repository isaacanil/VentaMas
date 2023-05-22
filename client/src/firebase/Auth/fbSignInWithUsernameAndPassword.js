import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

export async function authenticateUser(username, password) {
  // Obtén el documento del usuario de Firestore
  const userDoc = await getDoc(doc(db, 'users', username));

  // Comprueba la contraseña...
  // Esto debería hacerse con una función de comparación de contraseñas encriptadas, no en texto plano.
  if (userDoc.data().password !== password) {
    throw new Error('Contraseña incorrecta');
  }

  // Si la contraseña es correcta, inicia sesión en Firebase con el correo electrónico y la contraseña del usuario
  await signInWithEmailAndPassword(auth, userDoc.data().email, password);
}
