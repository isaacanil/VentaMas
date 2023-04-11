export const validationRules = {
    text: {
      validate: value => value.length > 0,
      message: 'Please enter a value'
    },
    email: {
      validate: value => /\S+@\S+\.\S+/.test(value),
      message: 'Please enter a valid email'
    },
    password: {
      validate: value => value.length >= 8,
      message: 'Password must be at least 8 characters long'
    },
    
    // Agrega más reglas de validación según tus necesidades
  };