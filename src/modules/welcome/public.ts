export const loadWelcomeRoute = () =>
  import('./pages/Welcome/Welcome').then((module) => ({
    default: module.Welcome,
  }));

export const loadWelcomeV2Route = () =>
  import('./pages/WelcomeV2/WelcomeV2').then((module) => ({
    default: module.WelcomeV2,
  }));
