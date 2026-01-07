// @ts-nocheck
export const navigateSafely = async (navigate, path) => {
  try {
    await navigate(path);
  } catch (error) {
    console.error('Error en la navegación:', error);
    throw error;
  }
};
