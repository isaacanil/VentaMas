import { formatPrice } from '@/utils/format';
import { ActionsButtonsGroup } from '@/views/pages/OrderAndPurchase/Compra/ListItem/ActionsButtonsGroup';
import { Button } from '@/views/templates/system/Button/Button';
import { ButtonGroup } from '@/views/templates/system/Button/ButtonGroup';

import { correctDate } from '@/hooks/time/correctDate';


export const PurchaseCard = ({
  purchaseData,
  Row,
  Col,
  activeId,
  setActiveId,
}) => {
  const { data } = purchaseData;

  return (
    <Row>
      <Col>{data.id}</Col>
      <Col size="limit">
        <div>{data.provider ? data.provider.name : null}</div>
      </Col>
      <Col>
        <Button title="ver" borderRadius="normal" color="gray-dark" />
      </Col>
      <Col>
        <div>{correctDate(data.createdAt).toLocaleDateString()}</div>
      </Col>
      <Col>
        <div>{correctDate(data.date).toLocaleDateString()}</div>
      </Col>
      <Col position="right">
        <div>{formatPrice(data.totalPurchase)}</div>
      </Col>
      <Col>
        <ButtonGroup>
          <ActionsButtonsGroup
            purchaseData={data}
            activeId={activeId}
            setActiveId={setActiveId}
          />
        </ButtonGroup>
      </Col>
    </Row>
  );
};
