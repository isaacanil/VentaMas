import React from 'react';
import { useDispatch } from 'react-redux';

import { formatPrice } from '@/utils/format';

import { getOrderStateByID } from '../../../../../constants/orderAndPurchaseState';
import { toggleViewOrdersNotes } from '../../../../../features/modals/modalSlice';
import { correctDate } from '../../../../../hooks/date/correctDate';
import { Button } from '../../../../templates/system/Button/Button';
import { Tooltip } from '../../../../templates/system/Button/Tooltip';
import { StatusIndicatorDot } from '../components/StatusIndicatorDot/StatusIndicatorDot';

import { ActionsButtonsGroup } from './ActionsButtonsGroup';

export const OrderCard = ({ orderData, Row, Col, activeId, setActiveId }) => {
  const dispatch = useDispatch();

  const { data } = orderData;

  const handleViewNotes = () => {
    dispatch(toggleViewOrdersNotes({ data, isOpen: 'open' }));
  };

  return (
    <Row>
      <Col>{data?.id}</Col>
      <Col>
        <StatusIndicatorDot
          color={data.state ? getOrderStateByID(data?.state)?.color : null}
        ></StatusIndicatorDot>
      </Col>
      <Col size="limit">
        <div>{data?.provider?.name || null}</div>
      </Col>
      <Col>
        <Tooltip
          placement="bottom"
          description="ver nota"
          Children={
            <Button
              title="ver"
              borderRadius="normal"
              color="gray-dark"
              border="light"
              onClick={handleViewNotes}
            />
          }
        />
      </Col>
      <Col>
        <div>{correctDate(data?.dates?.createdAt).toLocaleDateString()}</div>
      </Col>
      <Col>
        <div>{correctDate(data?.dates?.deliveryDate).toLocaleDateString()}</div>
      </Col>
      <Col position="right">
        <div>{formatPrice(data?.total)}</div>
      </Col>
      <Col>
        {data && (
          <ActionsButtonsGroup
            orderData={data}
            activeId={activeId}
            setActiveId={setActiveId}
          />
        )}
      </Col>
    </Row>
  );
};


