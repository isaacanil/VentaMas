import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as antd from 'antd';
import React, { useCallback, useRef } from 'react';
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
  const componentToPrintRef = useRef(null);
  const isCredit = isInvoicePaidInFull(data);
  const vw = useViewportWidth();
  const dispatch = useDispatch();
  const handleRePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });
  const proceedToEdit = useCallback(
    (authorization) => {
      const preparedInvoice = prepareInvoiceForEdit(data);
      if (preparedInvoice) {
        dispatch(
          addInvoice({
            invoice: preparedInvoice,
            mode: 'edit',
            authorizationRequest: authorization || null,
          }),
        );
      }
    },
    [data, dispatch],
  );

  const { handleEdit, authorizationModal, isProcessing } =
    useInvoiceEditAuthorization({
      invoice: data,
      onAuthorized: proceedToEdit,
    });
  const handleViewMore = () => {
    dispatch(openInvoicePreviewModal(data));
  };

  return (
    <>
      <Container>
        <Receipt ref={componentToPrintRef} data={data} />
        <OrderActions>
          <Button
            startIcon={icons.operationModes.edit}
            title={vw > 600 && 'Editar'}
            onClick={handleEdit}
            disabled={isProcessing}
          />
          <Button
            type="primary"
            startIcon={<FontAwesomeIcon icon={faPrint} />}
            title={vw > 600 && 'Imprimir'}
            onClick={handleRePrint}
          />
          <Button
            startIcon={icons.operationModes.more}
            title={vw > 600 && 'Ver más'}
            onClick={handleViewMore}
          />
        </OrderActions>
        <Tag color={isCredit ? 'green' : 'red'}>
          {isCredit ? 'Contado' : 'Crédito'}
        </Tag>
      </Container>
      {authorizationModal}
    </>
  );
};

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 1em;
  overflow: hidden;
`;
const OrderActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, min-content);
  gap: 0.6em;
`;
const Tag = styled(antd.Tag)`
  padding: 0.2em 0.4em;
  font-size: 1em;
  font-weight: 500;
  text-align: center;
  text-transform: capitalize;
  border-radius: 0.2em;
`;
