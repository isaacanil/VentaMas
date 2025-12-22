export const validateUser = (user) => {
  if (!user || !user?.businessID) {
    const error = new Error('User is not valid');
    error.name = 'UserValidationError';
    throw error;
  }
};
