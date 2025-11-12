const createMode = (label) => {
  return {
    id: label,
    label: label,
  };
};
export const OPERATION_MODES = Object.freeze({
  CREATE: createMode('create'),
  UPDATE: createMode('update'),
  DELETE: createMode('delete'),
});
