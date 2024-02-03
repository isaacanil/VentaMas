import { DateTime, Duration, } from 'luxon';
import React, { useEffect, useState } from 'react'
import * as antd from 'antd'
import styled from 'styled-components';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
const { Alert, Typography } = antd
export const InvoiceInfoExtras = ({ invoice }) => {
  const [remainingCancelationTime, setRemainingCancelationTime] = useState(0);

  useEffect(() => {
    const updateRemainingTime = () => {
      const now = DateTime.now();
      const expiryTime = DateTime.fromMillis(invoice.date).plus({ days: 2 });
      const remaining = expiryTime.diff(now, 'seconds').seconds;

      setRemainingCancelationTime(Math.max(0, remaining));
    };

    updateRemainingTime(); // Actualizar al montar el componente

    const timer = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timer);
  }, [invoice]);

  const formattedRemainingTime = () => {
    if (remainingCancelationTime <= 0) {
      return '00:00:00';
    }
    const duration = Duration.fromObject({ seconds: remainingCancelationTime });
    return duration.toFormat('hh:mm:ss');
  };
  return (
    <div>
      {remainingCancelationTime > 0 &&
        <div>

          <Alert
            closable

            message={`Tiempo restante para modificar la factura: ${formattedRemainingTime()}`}
            description="Una vez transcurrido este tiempo, no podrás realizar cambios en la factura."
            type="warning"
            showIcon
          />
          <br />

          <Resumen invoice={invoice} />


        </div>

      }
    </div>
  )
}
const Resumen = ({ invoice }) => {
  return (
    <div >
      <Descriptions>
        <Item>
          <Typography.Text >
            Articulos:
          </Typography.Text>
          <Typography.Text>
            {invoice.totalShoppingItems.value}
          </Typography.Text>
        </Item>
        <Item>
          <Typography.Text >
            Cambio:
          </Typography.Text>
          <Typography.Text type={
            invoice.change.value < 0 ? 'danger' :
              invoice.change.value == 0 ? 'success' : null}
          >
            {useFormatPrice(invoice.change.value)}
          </Typography.Text>
        </Item>
        <Item>
          <Typography.Text >
            SubTotal:
          </Typography.Text>
          <Typography.Text >
            {useFormatPrice(invoice.totalPurchaseWithoutTaxes.value)}
          </Typography.Text>
        </Item>
        <Item>
          <Typography.Text >
            Impuestos:
          </Typography.Text>
          <Typography.Text>
            {useFormatPrice(invoice.totalTaxes.value)}
          </Typography.Text>
        </Item>
        <Item>
          <Typography.Text >
            Descuento:
          </Typography.Text>
          <Typography.Text>
            {invoice.discount.value > 0 ? ` ${useFormatPrice((invoice.discount.value / 100) * invoice.totalPurchaseWithoutTaxes.value)}` : useFormatPrice('0.00')} ({invoice.discount.value}%)
          </Typography.Text>
        </Item>
        <Item>
          <Typography.Text >
            Total:
          </Typography.Text>
          <Typography.Text>
            {useFormatPrice(invoice.totalPurchase.value)}
          </Typography.Text>
        </Item>
      </Descriptions>
    </div>
  )
}
const Item = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`
const Descriptions = styled.div`
  max-width: 300px;
`