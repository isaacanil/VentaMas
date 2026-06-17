export const loadDeveloperHubRoute = () =>
  import('./pages/DeveloperHub/DeveloperHub').then((module) => ({
    default: module.DeveloperHub,
  }));

export const loadHomeRoute = () =>
  import('./pages/Home/Home').then((module) => ({
    default: module.Home,
  }));
