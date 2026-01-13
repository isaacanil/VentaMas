import { lazy } from 'react';

import RoutesName from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const ChangelogList = lazy(() =>
  import(
    '@/modules/controlPanel/ChangeLogControl/ChangelogList/ChangelogList'
  ).then((module) => ({ default: module.ChangelogList })),
);
const ChangelogManage = lazy(() =>
  import(
    '@/modules/controlPanel/ChangeLogControl/ChangelogManage/ChangelogManage'
  ).then((module) => ({ default: module.ChangelogManage })),
);

const { CHANGELOG_LIST, CHANGELOG_MANAGE } = RoutesName.CHANGELOG_TERM;

const Routes: AppRoute[] = [
  {
    path: CHANGELOG_LIST,
    element: <ChangelogList />,
  },
  {
    path: CHANGELOG_MANAGE,
    element: <ChangelogManage />,
  },
];

export default Routes;

