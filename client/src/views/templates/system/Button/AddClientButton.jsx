import { useDispatch } from "react-redux"
import { openModalAddClient } from "../../../../features/modals/modalSlice"
import { Button } from "./Button"
import { HiUserAdd } from "react-icons/hi"

export const AddClientButton = () => {
    const dispatch = useDispatch()

    const Open = () => dispatch(openModalAddClient())

    return (
        <Button
            title={<HiUserAdd />}
            borderRadius='normal'
            color='gray-dark'
            width='icon32'
            onClick={Open}
        />
    )
}

