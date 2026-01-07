// @ts-nocheck
import { Switch } from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  SelectSettingCart,
  togglePrintInvoice,
} from '@/features/cart/cartSlice';
import InvoiceTemplates from '@/views/component/Invoice/components/InvoiceTemplates/InvoiceTemplates';

export const PrintControl = () => {
  const cartSetting = useSelector(SelectSettingCart);
  const dispatch = useDispatch();
  const { printInvoice } = cartSetting;

  const handlePrintInvoice = () => dispatch(togglePrintInvoice());

  return (
    <Container>
      <InvoiceTemplates previewInModal hidePreviewButton />
      <Label>
        <Switch checked={printInvoice} onChange={handlePrintInvoice}></Switch>
        <span>Imprimir Factura </span>
      </Label>

      {/* <span>Imprimir Factura</span> */}
    </Container>
  );
};
const Container = styled.div`
  padding: 0.6em 0.8em;
`;
const Label = styled.span`
  display: flex;
  gap: 1em;
  margin-right: 1em;
`;
