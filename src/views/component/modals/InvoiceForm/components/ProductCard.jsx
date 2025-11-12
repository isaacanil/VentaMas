import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, InputNumber, Row } from "antd";
import React from "react";

const ProductCard = ({ quantity, setQuantity }) => {
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
