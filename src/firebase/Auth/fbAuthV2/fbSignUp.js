import { httpsCallable } from 'firebase/functions';

import { functions } from '../../firebaseconfig';

const clientSignUpCallable = httpsCallable(functions, 'clientSignUp');

const validateUserInput = ({ name, password, businessID, role }) => {
  if (!name) {
    throw new Error('Error: Es obligatorio proporcionar un nombre de usuario.');
  }
  if (!password) {
    throw new Error('Error: Es obligatorio proporcionar una contraseña.');
  }
  if (!businessID) {
    throw new Error('Error: Es obligatorio proporcionar un ID de negocio.');
  }
  if (!role) {
    throw new Error('Error: Es obligatorio seleccionar un rol.');
  }
};

export const fbSignUp = async (userData) => {
  validateUserInput(userData);

  try {
    const response = await clientSignUpCallable({ userData });
    return response?.data;
  } catch (error) {
    throw new Error(error?.message || 'Error creando usuario');
  }
};
