const THEME_STORAGE_KEY = 'theme';

export const readStoredTheme = () =>
  localStorage.getItem(THEME_STORAGE_KEY) || 'light';

export const writeStoredTheme = (theme: string) => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};
