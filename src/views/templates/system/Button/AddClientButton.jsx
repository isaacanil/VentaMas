import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from "react-redux"

import { openModalAddClient } from "../../../../features/modals/modalSlice"

import { Button } from "./Button"

export const AddClientButton = () => {
    const dispatch = useDispatch()

    const Open = () => dispatch(openModalAddClient())

    return (
        <Button
            title={<FontAwesomeIcon icon={faUserPlus} />}
            borderRadius='normal'
            color='gray-dark'
            width='icon32'
            onClick={Open}
        />
    )
}

