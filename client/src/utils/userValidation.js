class UserValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserValidationError";
    }
}

const validateUser = (user) => {
    if (!user || !user?.businessID) {
        throw new UserValidationError("No business ID found. Please contact support.");
    }
};

export { UserValidationError, validateUser };