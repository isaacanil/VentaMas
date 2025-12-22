import { lazy } from 'react';

import RoutesName from '../routesName';

const ChangelogList = lazy(() =>
  import(
    '@/views/controlPanel/ChangeLogControl/ChangelogList/ChangelogList'
  ).then((module) => ({ default: module.ChangelogList })),
);
const ChangelogManage = lazy(() =>
  import(
    '@/views/controlPanel/ChangeLogControl/ChangelogManage/ChangelogManage'
  ).then((module) => ({ default: module.ChangelogManage })),
);

const { CHANGELOG_LIST, CHANGELOG_MANAGE } = RoutesName.CHANGELOG_TERM;

const routes = [
  {
    path: CHANGELOG_LIST,
    element: <ChangelogList />,
  },
  {},
  {
    path: CHANGELOG_MANAGE,
    element: <ChangelogManage />,
  },
];

export default routes;
