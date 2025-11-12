import { useSelector } from 'react-redux';

import { selectInsuranceAuthData } from '../features/insurance/insuranceAuthSlice';

import useInsuranceEnabled from './useInsuranceEnabled';

/**
 * Custom hook to check if the insurance form is complete
 * Returns an object with isValid and insurance status
 */
const useInsuranceFormComplete = () => {
  const authData = useSelector(selectInsuranceAuthData);
  const insuranceEnabled = useInsuranceEnabled();

  // Si el seguro no está habilitado, no necesitamos validar
  if (!insuranceEnabled) {
    return {
      isFormComplete: false,
      insuranceEnabled,
      shouldDisableButton: false, // No deshabilitamos el botón si el seguro no está activo
    };
  }

  // Campos requeridos para la autorización de seguro
  const requiredFields = [
    'insuranceId',
    'insuranceType',
    'affiliateNumber',
    'authNumber',
    'doctor',
    'specialty',
    'indicationDate',
    'birthDate',
  ];

  // Verificar si todos los campos requeridos tienen valor
  const isFormComplete = requiredFields.every((field) => {
    const value = authData[field];
    return value !== undefined && value !== null && value !== '';
  });

  // Si el seguro está habilitado pero el formulario no está completo, debemos deshabilitar el botón
  const shouldDisableButton = insuranceEnabled && !isFormComplete;

  return {
    isFormComplete,
    insuranceEnabled,
    shouldDisableButton,
  };
};

export default useInsuranceFormComplete;
