import React from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import { CgNotes } from 'react-icons/cg'
import styled from 'styled-components'

import { Button } from '../../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import {useFormatPhoneNumber} from '../../../../../hooks/useFormatPhoneNumber'

import { Message } from '../../../../templates/system/message/Message'
import { useDispatch } from 'react-redux'
import { toggleClientModal } from '../../../../../features/modals/modalSlice'
import { OPERATION_MODES } from '../../../../../constants/modes'
import { icons } from '../../../../../constants/icons/icons'
import { fbDeleteClient } from '../../../../../firebase/client/fbDeleteClient'
import { ClientAdmin } from '../ClientAdmin'
export const OrderItem = ({ client, index, Row, Col }) => {
    const updateMode = OPERATION_MODES.UPDATE.id
    const noData = <Message title='(vacio)' fontSize='small' bgColor='error'/>
    const dispatch = useDispatch()
    const handleDeleteClient = (id) => {
        fbDeleteClient(id)
    }
    const openModalUpdateMode = () => {dispatch(toggleClientModal({mode: updateMode, data: client}))}
    return (
        <Row>
            <Col>{client.id}</Col>
            <Col>
                {client.name}
            </Col>
            <Col size='limit'>
                { client.tel ? useFormatPhoneNumber(client.tel) : noData}
            </Col>
            <Col>
                {client.personalID ? client.personalID : noData}
            </Col>
            <Col size='limit'>
                {client.address ? client.address : noData}
            </Col>
            <Col>
                <ButtonGroup>
                    <Button
                        borderRadius='normal'
                        title={icons.operationModes.edit}
                        width='icon32'
                        color='gray-dark'
                        onClick={openModalUpdateMode}
                    />
                    <Button
                        borderRadius='normal'
                        title={icons.operationModes.delete}
                        width='icon32'
                        color='gray-dark'
                        onClick={() => handleDeleteClient(client.id)}
                    />
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

