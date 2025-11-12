import { Card, Space, Typography } from 'antd';
import React from 'react';
import Barcode from 'react-barcode';

const { Title, Text } = Typography;

export const BarcodeResult = ({ generatedCode, isCurrentCode = false }) => {
  if (!generatedCode) return null;

  return (
    <Card 
      title={isCurrentCode ? "Código Actual" : "Código Generado"} 
      type="inner"
    >
      <Space direction="vertical" align="center" style={{ width: '100%' }}>
        <Title level={3} style={{ fontFamily: 'monospace', margin: 0 }}>
          {generatedCode}
        </Title>
        <Barcode
          value={generatedCode}
          width={2}
          height={60}
          displayValue={true}
          fontSize={16}
        />
        <Text type={isCurrentCode ? "warning" : "success"}>
          {isCurrentCode ? "📋 Este es el código actual del producto" : "✓ Código válido GTIN-13"}
        </Text>
      </Space>
    </Card>
  );
};

export default BarcodeResult;
