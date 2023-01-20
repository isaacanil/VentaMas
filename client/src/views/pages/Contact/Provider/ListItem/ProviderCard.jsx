import React from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { TbEdit } from 'react-icons/tb'
import { CgNotes } from 'react-icons/cg'
import styled from 'styled-components'

import { Button } from '../../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot'
import {useFormatPhoneNumber} from '../../../../../hooks/useFormatPhoneNumber'
import { deleteClient, deleteProvider } from '../../../../../firebase/firebaseconfig'
import { Message } from '../../../../templates/system/message/Message'
import { toggleProviderModal } from '../../../../../features/modals/modalSlice'
import { modes } from '../../../../../constants/modes'
import { useDispatch } from 'react-redux'
export const ProviderCard
 = ({ e, Row, Col }) => {
    const {updateMode} = modes.operationModes
    const noData = <Message title='(vacio)' fontSize='small' bgColor='error'/>
    const dispatch = useDispatch()
    const handleDeleteProvider = (id) => {
        deleteProvider(id)
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
                        onClick={() => handleDeleteProvider(e.id)}
                    />
                </ButtonGroup>
            </Col>

        </Row>
    )
}
const Container = styled.div`
`

