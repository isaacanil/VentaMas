import type { NavigateFunction } from 'react-router-dom';

export const navigateSafely = async (
  navigate: NavigateFunction,
  path: string,
): Promise<void> => {
  try {
    await navigate(path);
  } catch (error) {
    console.error('Error en la navegación:', error);
    throw error;
  }
};
