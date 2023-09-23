import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME from "../../../../../routes/routesName";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const { SETTINGS } = ROUTES_NAME.SETTING_TERM
const { CHANGELOG_LIST } = ROUTES_NAME.CHANGELOG_TERM

const changelogs = [
    {
        title: 'Actualizaciones',
        icon: <FontAwesomeIcon icon={faListCheck} />,
        route: CHANGELOG_LIST,
        group: 'admin'
    },
  
    
]

export default changelogs;