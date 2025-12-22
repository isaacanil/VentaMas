/**
 * Stores the current path before navigating to the config screen
 * This should be called before navigation to the config screen happens
 * @param {string} currentPath - The current path to store
 */
export const storePreviousPathBeforeConfig = (currentPath) => {
  // Don't store paths that are already part of the config section
  if (!currentPath.includes('/settings/general-config')) {
    sessionStorage.setItem('previousPathBeforeConfig', currentPath);
  }
};
