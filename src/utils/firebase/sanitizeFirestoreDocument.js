export const sanitizeFirestoreDocument = (input) => {
  const visit = (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => visit(item))
        .filter((item) => item !== undefined);
    }

    if (value && typeof value === 'object') {
      const prototype = Object.getPrototypeOf(value);
      const isPlainObject =
        prototype === Object.prototype || prototype === null;

      if (!isPlainObject) {
        return value;
      }

      return Object.entries(value).reduce((accumulator, [key, rawValue]) => {
        const sanitizedValue = visit(rawValue);
        if (sanitizedValue !== undefined) {
          accumulator[key] = sanitizedValue;
        }
        return accumulator;
      }, {});
    }

    return value;
  };

  return visit(input);
};
