
import React, { useState } from 'react';
import * as antd from 'antd';
import styled from 'styled-components';
import { fbUpdateClientsWithIncrementalNumber } from '@fbConfig/client/fbUpdateClientsWithIncrementalNumber';
import { fbDeleteFieldFromAllClients } from '../../../../firebase/client/fbDeleteFieldFromAllClient';
import Invoice from './Receipt/Invoice';
import { Receipt } from '../../../pages/checkout/Receipt';
import { AccountsReceivablePaymentReceipt } from '../../../pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt';
import { fbTransferProductsToAnotherBusiness } from '../../../../firebase/products/fbTransferProductsToAnotherBusiness';

const { message } = antd






export const Prueba = () => {
  const handleSubmit = async () => {
  await  fbTransferProductsToAnotherBusiness('EDW44d69fhdvE5QmuL2I', 'RPvpimCiUO4UW4tt50qn', 50)
  }
  return (
    <div>
      ZHola\

      <button onClick={handleSubmit}>
        Obtener Productos
      </button>
    </div>
  )
}


