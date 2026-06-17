export const loadUtilityReportRoute = () =>
  import('./pages/Utility/Utility').then((module) => ({
    default: module.Utility,
  }));
