import { Fragment } from "react"
import styled from "styled-components"
import { useDispatch } from "react-redux"
import { openModalAddClient } from "../../../../features/modals/modalSlice"
import { Button } from "./Button"
import { HiUserAdd } from "react-icons/hi"
//import { useModal } from '../../../../hooks/useModal'
export const AddClientButton = () => {
    //const { isOpen, closeModal, openModal } = useModal(false)
    const dispatch = useDispatch()
    const Open = () => {
        dispatch(
            openModalAddClient()
        )
    }
    return (


        <Button
            title={
                <HiUserAdd/>
            }
            color='gray-dark'
            width='icon32'
            onClick={Open}>

        </Button>

    )
}

