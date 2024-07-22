import React, { useRef } from 'react'
import * as antd from 'antd';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { isInvoicePaidInFull } from '../../../../../../utils/invoice';
import { icons } from '../../../../../../constants/icons/icons';
import { Button } from '../../../../../templates/system/Button/Button';
import useViewportWidth from '../../../../../../hooks/windows/useViewportWidth';
import { Receipt } from '../../../../checkout/Receipt';
import { useReactToPrint } from 'react-to-print';
import { useDispatch } from 'react-redux';
import { convertDate } from '../../../../../../utils/date/convertTimeStampToDate';
import { addInvoice } from '../../../../../../features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '../../../../../../features/invoice/invoicePreviewSlice';
export const Footer = ({ data }) => {
    const componentToPrintRef = useRef(null)
    const isCredit = isInvoicePaidInFull(data);
    const vw = useViewportWidth();
    const dispatch = useDispatch();
    const handleRePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
    })
    const handleEdit = () => {
        const invoiceData = {
            ...data,
            date: convertDate.fromTimestampToMillis(data.date),
            payWith: data?.paymentMethod.find((method) => method.status === true)?.value,
            updateAt: convertDate.fromTimestampToMillis(data?.updateAt),
            cancel: data?.cancel ? {
                ...data.cancel,
                cancelledAt: convertDate.fromTimestampToMillis(data?.cancel?.cancelledAt),
            } : null
        }
        dispatch(addInvoice({ invoice: invoiceData }))
    }
    const handleViewMore = () => {
        dispatch(openInvoicePreviewModal(data))
    }

    return (
        <>
            <Container>
                <Receipt ref={componentToPrintRef} data={data} />
                <OrderActions>
                    <Button
                        startIcon={icons.operationModes.edit}
                        title={vw > 600 && "Editar"}
                        onClick={handleEdit}
                    />
                    <Button
                        type="primary"
                        startIcon={<FontAwesomeIcon icon={faPrint} />}
                        title={vw > 600 && "Imprimir"}
                        onClick={handleRePrint}
                    />
                    <Button
                        startIcon={icons.operationModes.more}
                        title={vw > 600 && "Ver más"}
                        onClick={handleViewMore}
                    />
                </OrderActions>
                <Tag color={isCredit ? "green" : "red"}>
                    {isCredit ? "Contado" : "Crédito"}
                </Tag>
            </Container>
        </>
    )
}

const GreenButton = styled(antd.Button)`

  border-color: #52c41a;
  color: #52c41a;
  &:hover,
  &:focus {
     // Un verde ligeramente más claro para el hover y focus
    border-color: #73d13d !important;
    color: #73d13d !important;
  }
`;
const Container = styled.div`
display: grid;
gap: 1em;
overflow: hidden;
position: relative;
grid-template-columns: 1fr min-content;
`
const OrderActions = styled.div`
display: grid;
gap: 0.6em;
grid-template-columns: repeat(3, min-content);
`;
const Tag = styled(antd.Tag)`
    font-size: 1em;
    padding: 0.2em 0.4em;
    border-radius: 0.2em;
    font-weight: 500;
    text-transform: capitalize;
    text-align: center;
    `;
