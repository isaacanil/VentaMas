export const validateInputs = (user) => {
    const { name, email, password, confirmPassword, businessID } = user;

    if (!name || !email || !password || !businessID) {
        throw new Error('Todos los campos son obligatorios');
    } 

    return 'Todos los campos están bien';  // Si no se lanzó ningún error, los datos son válidos.
};