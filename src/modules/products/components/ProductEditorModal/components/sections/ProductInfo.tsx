import { Card, Button, Input, Row, Col, Select, Form } from 'antd';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { useCategoryState } from '@/context/CategoryContext/useCategoryState';
import { openModal } from '@/features/activeIngredients/activeIngredientsSlice';
import { openBrandModal } from '@/features/productBrands/productBrandSlice';
import { PRODUCT_ITEM_TYPE_OPTIONS } from '@/domain/products/productDefaults';
import { matchesSelectOptionText } from '@/domain/products/selectOptionText';
import { useFbGetCategories } from '@/firebase/categories/useFbGetCategories';
import { useListenActiveIngredients } from '@/firebase/products/activeIngredient/activeIngredients';
import { buildBrandOptions } from '@/domain/products/brandSelection';
import type {
  ActiveIngredient,
  ProductBrand,
  ProductRecord,
} from '@/types/products';

import { FieldWithAction } from './ProductInfo.styles';
import { getProductBrandFieldMeta } from './ProductInfo.helpers';

type ProductInfoProps = {
  product: ProductRecord;
  productBrands?: ProductBrand[];
};

const EMPTY_PRODUCT_BRANDS: ProductBrand[] = [];

type CategoryRecord = {
  category?: { name?: string };
} & Record<string, unknown>;

export const ProductInfo = ({
  product,
  productBrands = EMPTY_PRODUCT_BRANDS,
}: ProductInfoProps) => {
  const dispatch = useDispatch();
  const { categories } = useFbGetCategories() as {
    categories: CategoryRecord[];
  };
  const { data: activeIngredients } = useListenActiveIngredients() as {
    data: ActiveIngredient[];
  };
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
    <Card size="small" title="Información del producto" id="part-1">
      <Form.Item
        name="name"
        label={'Nombre del producto'}
        rules={[
          { required: true, message: 'Introducir un nombre de producto.' },
          { type: 'string', min: 4, message: 'Mínimo 4 caracteres.' },
        ]}
      >
        <Input placeholder="Ingresa el nombre del producto" />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="itemType"
            label="Tipo de ítem"
            tooltip="Define si se trata de un producto, servicio o combo."
            rules={[{ required: true, message: 'Selecciona el tipo de ítem.' }]}
          >
            <Select options={itemTypeOptions} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="type"
            label="Tipo de Producto"
            rules={[
              { required: true, message: 'Introducir un tipo de producto.' },
            ]}
          >
            <Input placeholder="Ingresa el tipo del producto " />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="netContent" label="Contenido Neto">
            <Input placeholder=" " />
          </Form.Item>
        </Col>
      </Row>

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
                icon={icons.operationModes.add}
                onClick={handleOpenBrandModal}
              />
            </Form.Item>
          </FieldWithAction>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="size" label="Tamaño">
            <Input placeholder="Ingresa el tamaño" />
          </Form.Item>
        </Col>
        <Col span={12}>
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
                icon={icons.operationModes.add}
                onClick={configureAddProductCategoryModal}
              />
            </Form.Item>
          </FieldWithAction>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
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
                icon={icons.operationModes.add}
                onClick={handleOpenActiveIngredientModal}
              />
            </Form.Item>
          </FieldWithAction>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="measurement" label="Medida">
            <Input placeholder="Ingresa la medida" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="footer" label="Pie">
            <Input placeholder="Ingresa el pie" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
