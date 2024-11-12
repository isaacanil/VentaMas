export const useFormatPhoneNumber = (input = '', warning = null) => {
  // Eliminando caracteres no numéricos excepto el símbolo "+"
  const cleanNumbers = input.replace(/[^\d+]/g, '');

  // Intentar dividir los posibles números con delimitadores comunes (comas, espacios, puntos, etc.)
  const phoneNumbers = input.split(/[,;.\s]+/).filter(num => num.replace(/\D/g, '').length > 0);

  // Verificar si hay múltiples números y si todos tienen la misma longitud
  const firstNumberDigits = phoneNumbers[0]?.replace(/\D/g, '').length;
  const allSameLength = phoneNumbers.every(num => num.replace(/\D/g, '').length === firstNumberDigits);

  // Si hay más de un número y no tienen la misma longitud, los unimos con "/"
  if (phoneNumbers.length > 1 && !allSameLength) {
      return phoneNumbers.join(' / '); // Unir números separados por "/"
  }

  // Si todos tienen la misma longitud, intentar formatearlos
  const formatPhoneNumber = (number) => {
      const digits = number.replace(/\D/g, ''); // Eliminar no numéricos para el formato

      // Formato para números con prefijo de país (+xx)
      if (digits.length > 10 && number.startsWith('+')) {
          const countryCode = number.match(/\+(\d+)/)?.[1];
          const rest = digits.slice(countryCode.length);
          return `+${countryCode} (${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6)}`;
      }
      
      // Formato para números de 10 dígitos (EE.UU., por ejemplo)
      if (digits.length === 10) {
          return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      }

      // Formato para números de 11 dígitos
      if (digits.length === 11) {
          return `+${digits[0]} (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
      }

      // Para otros casos o si no es un número reconocible, devolver el input original
      return number;
  };

  // Formatear los números encontrados
  const formattedNumbers = phoneNumbers.map(formatPhoneNumber);

  // Si hay múltiples números formateados correctamente
  if (formattedNumbers.length > 1) {
      return formattedNumbers.join(' / '); // Unir números con "/"
  } else {
      return formattedNumbers[0] || input; // Devolver el único número formateado o el input original
  }
};

