export const ValidationUtils = {
  validateArgument(value, label = 'valor', usage = '') {
    if (typeof value !== 'string' || !value.trim()) {
      const usageHint = usage ? `\nUso: ${usage}` : '';
      return {
        isValid: false,
        errorMessage: `Error: Debe especificar ${label}.${usageHint}`,
      };
    }
    return { isValid: true };
  },
};

export default ValidationUtils;
