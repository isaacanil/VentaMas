import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as antd from 'antd';
import React, { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { icons } from '../../../../../../constants/icons/icons';
import { addInvoice } from '../../../../../../features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '../../../../../../features/invoice/invoicePreviewSlice';
import useViewportWidth from '../../../../../../hooks/windows/useViewportWidth';
import { isInvoicePaidInFull } from '../../../../../../utils/invoice';
import { prepareInvoiceForEdit } from '../../../../../../utils/invoice';
import { Button } from '../../../../../templates/system/Button/Button';
import { Receipt } from '../../../../checkout/Receipt';
import useInvoiceEditAuthorization from '../../../hooks/useInvoiceEditAuthorization.jsx';

export const Footer = ({ data }) => {
    const componentToPrintRef = useRef(null)
    const isCredit = isInvoicePaidInFull(data);
    const vw = useViewportWidth();
    const dispatch = useDispatch();
    const handleRePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
    })
    const proceedToEdit = useCallback((authorization) => {
        const preparedInvoice = prepareInvoiceForEdit(data);
        if (preparedInvoice) {
            dispatch(
                addInvoice({
                    invoice: preparedInvoice,
                    mode: 'edit',
                    authorizationRequest: authorization || null,
                })
            );
        }
    }, [data, dispatch]);

    const { handleEdit, authorizationModal, isProcessing } = useInvoiceEditAuthorization({
        invoice: data,
        onAuthorized: proceedToEdit,
    });
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
                        disabled={isProcessing}
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
            {authorizationModal}
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
