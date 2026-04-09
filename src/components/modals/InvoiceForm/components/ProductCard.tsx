import { MinusOutlined, PlusOutlined } from '@/constants/icons/antd';
import { Button, Card, Col, Form, InputNumber, Row } from 'antd';
import React from 'react';

import type { Dispatch, SetStateAction } from 'react';

interface ProductCardProps {
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
}

const ProductCard = ({ quantity, setQuantity }: ProductCardProps) => {
  const increaseQuantity = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prevQuantity) => (prevQuantity > 0 ? prevQuantity - 1 : 0));
  };

  const handleChange = (value: number | null) => {
    if (typeof value === 'number') {
      setQuantity(value);
    }
  };

  return (
    <Card>
      <Form>
        <Form.Item label="">
          <Row gutter={16}>
            <Col>
              <Button icon={<MinusOutlined />} onClick={decreaseQuantity} />
            </Col>
            <Col>
              <InputNumber min={1} value={quantity} onChange={handleChange} />
            </Col>
            <Col>
              <Button icon={<PlusOutlined />} onClick={increaseQuantity} />
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProductCard;
