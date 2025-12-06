import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import ROUTES_NAME from '../../../../../routes/routesName';

const { CHANGELOG_LIST } = ROUTES_NAME.CHANGELOG_TERM;

const changelogs = [
  {
    title: 'Actualizaciones',
    icon: <FontAwesomeIcon icon={faListCheck} />,
    route: CHANGELOG_LIST,
    group: 'admin',
  },
];

export default changelogs;
