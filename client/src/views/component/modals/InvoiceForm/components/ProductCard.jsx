import React from 'react';
import * as antd from 'antd';
const { Form, Input, Button, InputNumber, Card, Row, Col } = antd;
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

const ProductCard = ({ productName, price, quantity, setQuantity }) => {
  const increaseQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prevQuantity => (prevQuantity > 0 ? prevQuantity - 1 : 0));
  };

  return (
    <Card >
      <Form>
        <Form.Item label="">
          <Row gutter={16}>
            <Col>
              <Button
                icon={<MinusOutlined />}
                onClick={decreaseQuantity}
              />
            </Col>
            <Col>
              <InputNumber
                min={1}
                value={quantity}
                onChange={setQuantity}
              />
            </Col>
            <Col>
              <Button
                icon={<PlusOutlined />}
                onClick={increaseQuantity}
              />
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProductCard;
