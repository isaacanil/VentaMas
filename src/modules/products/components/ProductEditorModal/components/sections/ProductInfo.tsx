import { Card, Button, Input, Row, Col, Select, Form } from 'antd';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { useCategoryState } from '@/context/CategoryContext/useCategoryState';
import { openModal } from '@/features/activeIngredients/activeIngredientsSlice';
import { PRODUCT_ITEM_TYPE_OPTIONS } from '@/domain/products/productDefaults';
import { matchesSelectOptionText } from '@/domain/products/selectOptionText';
import { buildBrandOptions } from '@/domain/products/brandSelection';
import { openBrandModal } from '@/modules/products/state/productBrandSlice';
import type {
  ActiveIngredient,
  ProductBrand,
  ProductRecord,
} from '@/types/products';

import { FieldWithAction } from './ProductInfo.styles';
import { getProductBrandFieldMeta } from './ProductInfo.helpers';
import { useProductInfoMetadata } from './hooks/useProductInfoMetadata';

type ProductInfoProps = {
  isCombo?: boolean;
  isService?: boolean;
  isRawMaterial?: boolean;
  product: ProductRecord;
  productBrands?: ProductBrand[];
};

const EMPTY_PRODUCT_BRANDS: ProductBrand[] = [];

export const ProductInfo = ({
  isCombo = false,
  isService = false,
  isRawMaterial = false,
  product,
  productBrands = EMPTY_PRODUCT_BRANDS,
}: ProductInfoProps) => {
  const dispatch = useDispatch();
  const { activeIngredients, categories } = useProductInfoMetadata();
  const { configureAddProductCategoryModal } = useCategoryState();
  const { Option } = Select;

  const handleOpenActiveIngredientModal = () =>
    dispatch(openModal({ initialValues: null }));
  const handleOpenBrandModal = () =>
    dispatch(openBrandModal({ initialValues: null }));

  const brandFieldMeta = useMemo(
    () => getProductBrandFieldMeta(product?.type),
    [product?.type],
  );
  const brandOptions = useMemo(
    () => buildBrandOptions(productBrands, product),
    [productBrands, product],
  );

  const itemTypeOptions = PRODUCT_ITEM_TYPE_OPTIONS;

  return (
    <Card
      size="small"
      title={
        isCombo
          ? 'Información del combo'
          : isService
            ? 'Información del servicio'
            : isRawMaterial
              ? 'Información de la materia prima'
              : 'Información del producto'
      }
      id="part-1"
    >
      <Form.Item
        name="name"
        label={
          isCombo
            ? 'Nombre del combo'
            : isService
              ? 'Nombre del servicio'
              : 'Nombre del producto'
        }
        rules={[
          {
            required: true,
            message: isCombo
              ? 'Introduce un nombre para el combo.'
              : isService
                ? 'Introduce un nombre para el servicio.'
              : 'Introducir un nombre de producto.',
          },
          { type: 'string', min: 4, message: 'Mínimo 4 caracteres.' },
        ]}
      >
        <Input
          placeholder={
            isCombo
              ? 'Ej: Combo desayuno familiar'
              : isService
                ? 'Ej: Instalación básica'
              : 'Ingresa el nombre del producto'
          }
        />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="itemType"
            label="Tipo de ítem"
            tooltip="Define si se trata de un producto, servicio o combo."
            rules={[{ required: true, message: 'Selecciona el tipo de ítem.' }]}
          >
            <Select options={itemTypeOptions} />
          </Form.Item>
        </Col>
        {isCombo ? (
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
        ) : (
          <Col xs={24} sm={12}>
            <Form.Item
              name="type"
              label={isService ? 'Tipo de Servicio' : 'Tipo de Producto'}
              rules={[
                {
                  required: true,
                  message: isService
                    ? 'Introducir un tipo de servicio.'
                    : 'Introducir un tipo de producto.',
                },
              ]}
            >
              <Input
                placeholder={
                  isService
                    ? 'Instalación, asesoría, mantenimiento'
                    : 'Ingresa el tipo del producto'
                }
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {!isCombo && !isService ? (
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="inventoryRole"
              label="Rol"
              tooltip="Define si se venderá al cliente o si será inventario interno."
              rules={[{ required: true, message: 'Selecciona un rol.' }]}
            >
              <Select
                options={[
                  { value: 'sellable', label: 'Producto vendible' },
                  { value: 'raw_material', label: 'Materia prima' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="netContent" label="Contenido Neto">
              <Input placeholder=" " />
            </Form.Item>
          </Col>
        </Row>
      ) : null}

      {!isCombo && !isService ? (
        <Row gutter={16}>
          <Col span={24}>
            <FieldWithAction>
              <Form.Item
                name="brandId"
                label={brandFieldMeta.label}
                tooltip="Este campo se adapta al tipo de producto para capturar la marca, laboratorio o fabricante."
                extra={brandFieldMeta.helper}
              >
                <Select
                  showSearch
                  placeholder={brandFieldMeta.placeholder}
                  options={brandOptions}
                  optionFilterProp="label"
                  filterOption={(inputValue, option) =>
                    matchesSelectOptionText(inputValue, option?.label)
                  }
                />
              </Form.Item>
              <Form.Item label={' '}>
                <Button
                  aria-label="Agregar marca"
                  icon={icons.operationModes.add}
                  onClick={handleOpenBrandModal}
                  title="Agregar marca"
                />
              </Form.Item>
            </FieldWithAction>
          </Col>
        </Row>
      ) : null}

      <Row gutter={16}>
        {!isCombo && !isService ? (
          <Col xs={24} sm={12}>
            <Form.Item name="size" label="Tamaño">
              <Input placeholder="Ingresa el tamaño" />
            </Form.Item>
          </Col>
        ) : null}
        <Col xs={24} sm={isCombo || isService ? 24 : 12}>
          <FieldWithAction>
            <Form.Item name="category" label={'Categoría'}>
              <Select
                showSearch
                placeholder="Selecciona una categoría"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  matchesSelectOptionText(input, option?.children)
                }
              >
                <Option key="none" value="none">
                  Ninguna
                </Option>
                {categories
                  .map(({ category }) => category?.name)
                  .filter((name): name is string => Boolean(name))
                  .map((name) => (
                    <Option key={name} value={name}>
                      {name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item label={' '}>
              <Button
                aria-label="Agregar categoría"
                icon={icons.operationModes.add}
                onClick={configureAddProductCategoryModal}
                title="Agregar categoría"
              />
            </Form.Item>
          </FieldWithAction>
        </Col>
      </Row>
      {!isCombo && !isService ? (
        <>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <FieldWithAction>
                <Form.Item name="activeIngredients" label={'Principio Activo'}>
                  <Select
                    showSearch
                    placeholder="Selecciona el principio activo"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      matchesSelectOptionText(input, option?.children)
                    }
                  >
                    <Option key="none" value="none">
                      Ninguno
                    </Option>
                    {activeIngredients
                      .filter(
                        (
                          ingredient,
                        ): ingredient is ActiveIngredient & {
                          id: string;
                          name: string;
                        } => Boolean(ingredient?.id && ingredient?.name),
                      )
                      .map((ingredient) => (
                        <Option key={ingredient.id} value={ingredient.name}>
                          {ingredient.name}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
                <Form.Item label={' '}>
                  <Button
                    aria-label="Agregar principio activo"
                    icon={icons.operationModes.add}
                    onClick={handleOpenActiveIngredientModal}
                    title="Agregar principio activo"
                  />
                </Form.Item>
              </FieldWithAction>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="measurement" label="Medida">
                <Input placeholder="Ingresa la medida" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="footer" label="Pie">
                <Input placeholder="Ingresa el pie" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ) : null}
    </Card>
  );
};
