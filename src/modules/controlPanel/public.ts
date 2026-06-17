export const loadAllUsersControlRoute = () =>
  import('./AllUsersControl/AllUsersControl').then((module) => ({
    default: module.AllUsersControl,
  }));

export const loadAppConfigRoute = () => import('./AppConfig/AppConfig');

export const loadBusinessControlRoute = () =>
  import('./CreateBusinessControl/BusinessControl').then((module) => ({
    default: module.BusinessControl,
  }));

export const loadChangelogCreateRoute = () =>
  import('./ChangeLogControl/ChangeLogCreate/ChangeLogCreate');

export const loadChangelogListRoute = () =>
  import('./ChangeLogControl/ChangelogList/ChangelogList').then((module) => ({
    default: module.ChangelogList,
  }));

export const loadChangelogManageRoute = () =>
  import('./ChangeLogControl/ChangelogManage/ChangelogManage').then(
    (module) => ({ default: module.ChangelogManage }),
  );

export const loadLoginImageConfigRoute = () =>
  import('./AppConfig/LoginImageConfig');
