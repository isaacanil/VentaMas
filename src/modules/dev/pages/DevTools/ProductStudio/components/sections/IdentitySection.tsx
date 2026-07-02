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
import type { SyntheticEvent } from 'react';
import styled from 'styled-components';

import type { BrandOption } from '@/domain/products/brandSelection';
import { imgFailed } from '@/domain/products/productAssets';
import { matchesSelectOptionText } from '@/domain/products/selectOptionText';
import type { CategoryDocument } from '@/firebase/categories/types';
import {
  DividerLabel,
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SwitchField,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';
import type { ActiveIngredient, ProductRecord } from '@/types/products';

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

const EmptyPreviewIcon = styled(CloudUploadOutlined)`
  font-size: 48px;
  color: #94a3b8;
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

interface BrandMeta {
  label: string;
  placeholder: string;
  helper: string;
}

interface IdentitySectionProps {
  isCombo?: boolean;
  isService?: boolean;
  isRawMaterial?: boolean;
  domId: string;
  brandMeta: BrandMeta;
  brandOptions: BrandOption[];
  categories: CategoryDocument[];
  activeIngredients: ActiveIngredient[];
  product?: ProductRecord | null;
  onOpenBrandModal: () => void;
  onAddCategory: () => void;
  onAddActiveIngredient: () => void;
  onOpenImageManager: () => void;
  onResetImage: () => void;
}

export const IdentitySection = ({
  isCombo = false,
  isService = false,
  isRawMaterial = false,
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
}: IdentitySectionProps) => (
  <SectionCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>
        {isCombo
          ? 'Información del combo'
          : isService
            ? 'Servicio'
            : isRawMaterial
              ? 'Materia prima'
              : 'General'}
      </SectionTitle>
      <SectionDescription>
        {isCombo
          ? 'Define cómo se identificará y venderá este combo.'
          : isService
            ? 'Define cómo se identificará y facturará este servicio.'
            : isRawMaterial
              ? 'Define cómo se identificará este insumo interno.'
              : 'Define cómo se verá y clasificará tu artículo.'}
      </SectionDescription>
    </SectionHeader>

    {!isCombo ? (
      <ImagePanel>
        <PreviewFrame>
          {product?.image ? (
            <img
              src={product.image}
              alt={product?.name || (isService ? 'Servicio' : 'Producto')}
              onError={(event: SyntheticEvent<HTMLImageElement>) => {
                event.currentTarget.src = imgFailed;
              }}
            />
          ) : (
            <EmptyPreviewIcon />
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
            Usa una imagen cuadrada para que tu{' '}
            {isService
              ? 'servicio'
              : isRawMaterial
                ? 'materia prima'
                : 'producto'} se vea mejor.
          </Text>
        </PreviewActions>
      </ImagePanel>
    ) : null}

    <FieldGrid>
      <Form.Item
        name="name"
        label={
          isCombo
            ? 'Nombre del combo'
            : isService
              ? 'Nombre del servicio'
              : 'Nombre comercial'
        }
        rules={[
          {
            required: true,
            message: isCombo
              ? 'Introduce un nombre para el combo.'
              : isService
                ? 'Introduce un nombre para el servicio.'
              : 'Introduce un nombre.',
          },
          { type: 'string', min: 4, message: 'Usa al menos 4 caracteres.' },
        ]}
      >
        <Input
          placeholder={
            isCombo
              ? 'Ej: Combo desayuno familiar'
              : isService
                ? 'Ej: Instalación básica'
              : 'Ej: Acetaminofén 500mg 24 tablets'
          }
        />
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

      {!isCombo ? (
        <Form.Item
          name="type"
          label={isService ? 'Tipo de servicio' : 'Familia / línea'}
          rules={[
            {
              required: true,
              message: isService
                ? 'Especifica el tipo de servicio.'
                : 'Especifica la familia.',
            },
          ]}
        >
          <Input
            placeholder={
              isService
                ? 'Instalación, asesoría, mantenimiento'
                : 'Farmacia, Cosméticos, Bebidas…'
            }
          />
        </Form.Item>
      ) : null}

      {!isCombo && !isService ? (
        <Form.Item
          name="inventoryRole"
          label="Rol"
          tooltip="Define si se venderá al cliente o si será solo inventario interno."
          rules={[{ required: true, message: 'Selecciona un rol.' }]}
        >
          <Select
            options={[
              { value: 'sellable', label: 'Producto vendible' },
              { value: 'raw_material', label: 'Materia prima' },
            ]}
          />
        </Form.Item>
      ) : null}

      {!isCombo && !isService ? (
        <Form.Item name="netContent" label="Contenido neto">
          <Input placeholder="Ej: 500 ml, 30 cápsulas" />
        </Form.Item>
      ) : null}
    </FieldGrid>

    <Row gutter={16}>
      {!isCombo && !isService ? (
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
                  matchesSelectOptionText(inputValue, option?.label)
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
      ) : null}
      <Col xs={24} md={isCombo || isService ? 24 : 12}>
        <Form.Item name="category" label="Categoría">
          <FieldWithAction>
            <Select
              showSearch
              placeholder="Asigna una categoría"
              optionFilterProp="children"
              filterOption={(input, option) =>
                matchesSelectOptionText(input, option?.children)
              }
              allowClear
            >
              <Option key="none" value="none">
                Ninguna
              </Option>
              {categories.map(({ category }) => {
                const categoryName =
                  typeof category?.name === 'string' ? category.name : '';
                if (!categoryName) {
                  return null;
                }
                return (
                  <Option
                    key={category?.id || categoryName}
                    value={categoryName}
                  >
                    {categoryName}
                  </Option>
                );
              })}
            </Select>
            <Button
              icon={<PlusOutlined />}
              type="default"
              shape="circle"
              onClick={onAddCategory}
              aria-label="Agregar categoría"
            />
          </FieldWithAction>
        </Form.Item>
      </Col>
    </Row>

    {!isCombo && !isService ? (
      <FieldGrid>
        <Form.Item name="size" label="Presentación / tamaño">
          <Input placeholder="Caja x 24, Frasco 1L…" />
        </Form.Item>
        <Form.Item name="measurement" label="Medida interna">
          <Input placeholder="Útil para reportes internos" />
        </Form.Item>
        <Form.Item name="footer" label="Pie / nota adicional">
          <Input placeholder="Información legal u observaciones" />
        </Form.Item>
        <Form.Item name="activeIngredients" label="Principio activo">
          <FieldWithAction>
            <Select
              showSearch
              placeholder="Selecciona el principio activo"
              optionFilterProp="children"
              filterOption={(input, option) =>
                matchesSelectOptionText(input, option?.children)
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
    ) : null}

    {!isRawMaterial ? (
      <>
        <Divider titlePlacement="left">
          <DividerLabel>
            <SettingOutlined /> Visibilidad
          </DividerLabel>
        </Divider>

        <FieldGrid>
          <SwitchField
            name="isVisible"
            label="Mostrar en catálogos"
            tooltip="Controla si este producto aparece en tus catálogos y punto de venta."
            valuePropName="checked"
          >
            <Switch />
          </SwitchField>
        </FieldGrid>
      </>
    ) : null}
  </SectionCard>
);
