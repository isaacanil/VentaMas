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
import { toggleProviderModal } from '../../../../../features/modals/modalSlice'
import { OPERATION_MODES } from '../../../../../constants/modes'
import { useDispatch, useSelector } from 'react-redux'
import { icons } from '../../../../../constants/icons/icons'
import { fbDeleteProvider } from '../../../../../firebase/provider/fbDeleteProvider'
import { selectUser } from '../../../../../features/auth/userSlice'
export const ProviderCard = ({ e, Row, Col }) => {
    const updateMode = OPERATION_MODES.UPDATE.id
    const user = useSelector(selectUser)
    const noData = <Message title='(vacio)' fontSize='small' bgColor='error'/>
    const dispatch = useDispatch()
    const handleDeleteProvider = (id) => {
        fbDeleteProvider(id, user)
    }
    const openModalUpdateMode = () => {dispatch(toggleProviderModal({mode: updateMode, data: e}))}
    return (
        <Row>
            <Col>{e.id}</Col>
            <Col>
                {e.name}
            </Col>
            <Col size='limit'>
                { e.tel !== '' ? useFormatPhoneNumber(e.tel) : noData}
            </Col>
            <Col>
                {e.address ? e.address : noData}
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
                        onClick={() => handleDeleteProvider(e.id)}
                    />
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

