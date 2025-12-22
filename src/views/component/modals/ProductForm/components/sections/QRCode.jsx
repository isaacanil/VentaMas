import { Card, Space, Input, Form, QRCode as AntdQRCode, Tooltip } from 'antd';

export const QRCode = ({ product }) => {
  return (
    <Card
      title="Código QR"
      size="small"
      extra={
        <Tooltip title="El código de barra es un código que se representa en forma de barras y espacios que pueden ser leídos e interpretados por un escáner. El código de barras se utiliza para identificar productos de forma única a nivel mundial.">
          {/* <Button type="link" shape="circle" icon={<QuestionCircleOutline />} /> */}
        </Tooltip>
      }
    >
      <Space direction="vertical" align="center" style={{ width: '100%' }}>
        <AntdQRCode size={100} value={product?.qrcode || '-'} />
        <Form.Item
          name="qrcode"
          style={{
            marginBottom: 0,
          }}
        >
          <Input placeholder="Código QR" maxLength={60} />
        </Form.Item>
      </Space>
    </Card>
  );
};
