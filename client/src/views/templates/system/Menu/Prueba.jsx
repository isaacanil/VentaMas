
import React, { useState } from 'react';
import * as antd from 'antd';
import styled from 'styled-components';
import { fbUpdateClientsWithIncrementalNumber } from '@fbConfig/client/fbUpdateClientsWithIncrementalNumber';
import { fbDeleteFieldFromAllClients } from '../../../../firebase/client/fbDeleteFieldFromAllClient';
import Invoice from './Receipt/Invoice';
import { Receipt } from '../../../pages/checkout/Receipt';
import { AccountsReceivablePaymentReceipt } from '../../../pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt';

const { message } = antd






export const Prueba = () => {

  return (
    <div>
    <AccountsReceivablePaymentReceipt  />
    </div>
  )
}


