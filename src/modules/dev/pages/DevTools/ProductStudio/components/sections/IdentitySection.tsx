// @ts-nocheck
import {
  CloudUploadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Typography,
} from 'antd';
import styled from 'styled-components';

import { imgFailed } from '@/components/modals/ProductForm/ImageManager/ImageManager';
import {
  DividerLabel,
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SwitchField,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';

const { Text } = Typography;

const ImagePanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 16px;
`;

const PreviewFrame = styled.div`
  display: flex;
  flex: 0 0 140px;
  align-items: center;
  justify-content: center;
  height: 140px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewActions = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  min-width: 140px;
`;

const PreviewButton = styled(Button)`
  justify-content: center;
  width: 140px;
`;

const { Option } = Select;

const FieldWithAction = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  .ant-select,
  .ant-input {
    flex: 1;
  }
`;

export const IdentitySection = ({
  domId,
  brandMeta,
  brandOptions,
  categories,
  activeIngredients,
  product,
  onOpenBrandModal,
  onAddCategory,
  onAddActiveIngredient,
  onOpenImageManager,
  onResetImage,
}) => (
  <SectionCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>General</SectionTitle>
      <SectionDescription>
        Define cÃ³mo se verÃ¡ y clasificarÃ¡ tu artÃ­culo.
      </SectionDescription>
    </SectionHeader>

    <ImagePanel>
      <PreviewFrame>
        {product?.image ? (
          <img
            src={product.image}
            alt={product?.name || 'Producto'}
            onError={(event) => (event.currentTarget.src = imgFailed)}
          />
        ) : (
          <CloudUploadOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
        )}
      </PreviewFrame>
      <PreviewActions>
        <PreviewButton
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={onOpenImageManager}
        >
          Agregar
        </PreviewButton>
        <PreviewButton
          icon={<ReloadOutlined />}
          onClick={onResetImage}
          disabled={!product?.image}
        >
          Restablecer
        </PreviewButton>
        <Text type="secondary">
          Usa una imagen cuadrada para que tu producto se vea mejor en catÃ¡logos
          y POS.
        </Text>
      </PreviewActions>
    </ImagePanel>

    <FieldGrid>
      <Form.Item
        name="name"
        label="Nombre comercial"
        rules={[
          { required: true, message: 'Introduce un nombre.' },
          { type: 'string', min: 4, message: 'Usa al menos 4 caracteres.' },
        ]}
      >
        <Input placeholder="Ej: AcetaminofÃ©n 500mg 24 tablets" />
      </Form.Item>

      <Form.Item
        name="itemType"
        label="Tipo"
        tooltip="Define si manejas inventario (producto), servicios o combos."
        rules={[{ required: true, message: 'Selecciona un tipo.' }]}
      >
        <Select
          options={[
            { value: 'product', label: 'Producto' },
            { value: 'service', label: 'Servicio' },
            { value: 'combo', label: 'Combo' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="type"
        label="Familia / lÃ­nea"
        rules={[{ required: true, message: 'Especifica la familia.' }]}
      >
        <Input placeholder="Farmacia, CosmÃ©ticos, Bebidasâ€¦" />
      </Form.Item>

      <Form.Item name="netContent" label="Contenido neto">
        <Input placeholder="Ej: 500 ml, 30 cÃ¡psulas" />
      </Form.Item>
    </FieldGrid>

    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="brandId"
          label={brandMeta.label}
          tooltip="Este campo se adapta al tipo de producto."
          extra={brandMeta.helper}
        >
          <FieldWithAction>
            <Select
              showSearch
              placeholder={brandMeta.placeholder}
              options={brandOptions}
              optionFilterProp="label"
              filterOption={(inputValue, option) =>
                (option?.label || '')
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
            />
            <Button
              icon={<PlusOutlined />}
              type="default"
              shape="circle"
              onClick={onOpenBrandModal}
              aria-label="Agregar marca"
            />
          </FieldWithAction>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="category" label="CategorÃ­a">
          <FieldWithAction>
            <Select
              showSearch
              placeholder="Asigna una categorÃ­a"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              allowClear
            >
              <Option key="none" value="none">
                Ninguna
              </Option>
              {categories.map(({ category }) => (
                <Option
                  key={category?.id || category?.name}
                  value={category.name}
                >
                  {category.name}
                </Option>
              ))}
            </Select>
            <Button
              icon={<PlusOutlined />}
              type="default"
              shape="circle"
              onClick={onAddCategory}
              aria-label="Agregar categorÃ­a"
            />
          </FieldWithAction>
        </Form.Item>
      </Col>
    </Row>

    <FieldGrid>
      <Form.Item name="size" label="PresentaciÃ³n / tamaÃ±o">
        <Input placeholder="Caja x 24, Frasco 1Lâ€¦" />
      </Form.Item>
      <Form.Item name="measurement" label="Medida interna">
        <Input placeholder="Ãštil para reportes internos" />
      </Form.Item>
      <Form.Item name="footer" label="Pie / nota adicional">
        <Input placeholder="InformaciÃ³n legal u observaciones" />
      </Form.Item>
      <Form.Item name="activeIngredients" label="Principio activo">
        <FieldWithAction>
          <Select
            showSearch
            placeholder="Selecciona el principio activo"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children || '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            allowClear
          >
            <Option key="none" value="none">
              Ninguno
            </Option>
            {activeIngredients.map((ingredient) => (
              <Option key={ingredient.id} value={ingredient.name}>
                {ingredient.name}
              </Option>
            ))}
          </Select>
          <Button
            icon={<PlusOutlined />}
            type="default"
            shape="circle"
            onClick={onAddActiveIngredient}
            aria-label="Agregar principio activo"
          />
        </FieldWithAction>
      </Form.Item>
    </FieldGrid>

    <Divider orientation="left">
      <DividerLabel>
        <SettingOutlined /> Visibilidad
      </DividerLabel>
    </Divider>

    <FieldGrid>
      <SwitchField
        name="isVisible"
        label="Mostrar en catÃ¡logos"
        tooltip="Controla si este producto aparece en tus catÃ¡logos y punto de venta."
        valuePropName="checked"
      >
        <Switch />
      </SwitchField>
      <SwitchField
        name="hasExpirationDate"
        label="Requiere caducidad"
        tooltip="Activa si el producto tiene fecha de vencimiento."
        valuePropName="checked"
      >
        <Switch />
      </SwitchField>
    </FieldGrid>
  </SectionCard>
);

