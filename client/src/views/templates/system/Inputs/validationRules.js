export const validationRules = {
    text: {
      validate: value => value.length > 0,
      message: 'Please enter a value'
    },
    password: {
      validate: value => value.length >= 8,
      message: 'Password must be at least 8 characters long'
    },
    // Agrega más reglas de validación según tus necesidades
  };