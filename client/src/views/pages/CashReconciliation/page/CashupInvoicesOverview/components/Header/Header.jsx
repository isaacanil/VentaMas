import React from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../../templates/system/Button/Button'
import { useNavigate } from 'react-router-dom'
import { formatBill } from '../../../../../../../hooks/exportToExcel/formatBill'
import { useDispatch } from 'react-redux'
import exportToExcel from '../../../../../../../hooks/exportToExcel/useExportToExcel'
import { addNotification } from '../../../../../../../features/notification/notificationSlice'
import {icons} from '../../../../../../../constants/icons/icons'
export const Header = ({ invoices = [] }) => {
    console.log(invoices)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const close = () => {
        navigate(-1)
    }

    const transformedResumenBillsData = () => invoices.map((invoice) => {
        return formatBill({ data: invoice.data, type: 'Resumen' });
    });

    const transformedDetailedBillsData = () => {
        return formatBill({ data: invoices, type: 'Detailed' });
    };

    const handleExportButton = (type) => {
        if (invoices.length === 0) {
            dispatch(addNotification({ title: 'Error al exportar', message: 'No hay Facturas para exportar', type: 'error' }))
            return
        }
        switch (type) {
            case 'Resumen':
                exportToExcel(transformedResumenBillsData(), 'Registros', 'Registro.xlsx');
                break;
            case 'Detailed':
                exportToExcel(transformedDetailedBillsData(), 'Registros', 'Registro.xlsx');
                break;
            default:
                break;
        }
    };
    
    return (
        <Container>
            <Button startIcon={icons.arrows.chevronLeft} title={'volver'} bgcolor={'primary'} onClick={close}></Button>
            <Group>
            <Button title={'Exportar Detalle'} onClick={() => handleExportButton('Detailed') } />
            <Button title={'Exportar Resumen'} onClick={() => handleExportButton('Resumen')}/>
            </Group>
        </Container>
    )
}
const Container = styled.div`
    max-width: 1300px;
    width: 100%;
    height: 3em;
    display: flex;
    align-items: center;
    margin: 0 auto;
    gap: 1em;
    justify-content: space-between;
`
const Group = styled.div`   
    display: flex;
    align-items: center;
    gap: 1em;
`