import { faMagnifyingGlass, faUserPen, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sync } from "framer-motion";
import { nanoid } from "nanoid";

export const CLIENT_MODE_BAR = Object.freeze(
    {
        SEARCH: {
            id: nanoid(),
            label: 'Buscar Cliente',
            icon: <FontAwesomeIcon icon={faMagnifyingGlass} />,
            showClientList: true,
        },
        CREATE: {
            id: nanoid(),
            label: 'Nombre',
            icon: <FontAwesomeIcon icon={faUserPlus} />,
            showClientList: false,
        },
        UPDATE: {
            id: nanoid(),
            label: 'Cliente',
            icon: <FontAwesomeIcon icon={faUserPen} />,
            showClientList: false,
        },
    }
)