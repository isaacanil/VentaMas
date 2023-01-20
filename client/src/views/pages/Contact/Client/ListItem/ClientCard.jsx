import React from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import { CgNotes } from 'react-icons/cg'
import styled from 'styled-components'

import { Button } from '../../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import {useFormatPhoneNumber} from '../../../../../hooks/useFormatPhoneNumber'
import { deleteClient } from '../../../../../firebase/firebaseconfig'
import { Message } from '../../../../templates/system/message/Message'
import { useDispatch } from 'react-redux'
import { toggleClientModal } from '../../../../../features/modals/modalSlice'
import { modes } from '../../../../../constants/modes'
export const OrderItem = ({ e, index, Row, Col }) => {
    const {updateMode} = modes.operationModes
    const noData = <Message title='(vacio)' fontSize='small' bgColor='error'/>
    const dispatch= useDispatch()
    const handleDeleteClient = (id) => {
        deleteClient(id)
    }
    const openModalUpdateMode = () => {dispatch(toggleClientModal({mode: updateMode, data: e}))}
    return (
        <Row>
            <Col>{e.id}</Col>
            <Col>
                {e.name}
            </Col>
            <Col size='limit'>
                { e.tel ? useFormatPhoneNumber(e.tel) : noData}
            </Col>
            <Col>
                {e.personalID ? e.personalID : noData}
            </Col>


            <Col size='limit'>
                {e.address ? e.address : noData}
            </Col>
            <Col>
                <ButtonGroup>
                    <Button
                        borderRadius='normal'
                        title={<TbEdit />}
                        width='icon32'
                        color='gray-dark'
                        onClick={openModalUpdateMode}
                    />
                    <Button
                        borderRadius='normal'
                        title={<IoTrashSharp />}
                        width='icon32'
                        bgcolor='error'
                        onClick={() => handleDeleteClient(e.id)}
                    />
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

