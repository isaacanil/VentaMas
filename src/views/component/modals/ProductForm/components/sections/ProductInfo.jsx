import { Card, Button, Input, Row, Col, Select, Form } from 'antd';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { icons } from '../../../../../../constants/icons/icons';
import { useCategoryState } from '../../../../../../Context/CategoryContext';
import { openModal } from '../../../../../../features/activeIngredients/activeIngredientsSlice';
import { openBrandModal } from '../../../../../../features/productBrands/productBrandSlice';
import {
  PRODUCT_BRAND_DEFAULT,
  PRODUCT_ITEM_TYPE_OPTIONS,
} from '../../../../../../features/updateProduct/updateProductSlice';
import { useFbGetCategories } from '../../../../../../firebase/categories/useFbGetCategories';
import { useListenActiveIngredients } from '../../../../../../firebase/products/activeIngredient/activeIngredients';
import {
  BRAND_DEFAULT_OPTION_VALUE,
  BRAND_LEGACY_OPTION_VALUE,
} from '../../constants/brandOptions';

export const ProductInfo = ({ product, productBrands = [] }) => {
  const dispatch = useDispatch();
  const { categories } = useFbGetCategories();
  const { data: activeIngredients } = useListenActiveIngredients();
  const { configureAddProductCategoryModal } = useCategoryState();
  const { Option } = Select;

  const handleOpenActiveIngredientModal = () =>
    dispatch(openModal({ initialValues: null }));
  const handleOpenBrandModal = () =>
    dispatch(openBrandModal({ initialValues: null }));

  const brandFieldMeta = useMemo(() => {
    const normalizedType = (product?.type || '').toLowerCase();
    if (
      normalizedType.includes('medic') ||
      normalizedType.includes('farm') ||
      normalizedType.includes('salud')
    ) {
      return {
        label: 'Marca / Laboratorio',
        placeholder: 'Ej: Pfizer, Genfar, Laboratorio ACME',
        helper:
          'Indica la marca comercial, laboratorio o denominación bajo la cual se vende el producto.',
      };
    }
    if (
      normalizedType.includes('bebida') ||
      normalizedType.includes('alimento') ||
      normalizedType.includes('consumo')
    ) {
      return {
        label: 'Marca / Casa comercial',
        placeholder: 'Ej: Coca-Cola, La Costeña, Artesanal',
        helper:
          'Puedes registrar la marca comercial, línea artesanal o fabricante principal.',
      };
    }
    if (
      normalizedType.includes('cosm') ||
      normalizedType.includes('higiene') ||
      normalizedType.includes('belleza')
    ) {
      return {
        label: 'Marca / Línea',
        placeholder: "Ej: L'Oréal, Dove, Genérico",
        helper:
          'Define la casa comercial, línea o fabricante responsable del producto.',
      };
    }
    return {
      label: 'Marca',
      placeholder: 'Ej: Samsung, Genérico, Marca Propia',
      helper:
        'Registra la marca, fabricante o referencia que identifique el producto en tu catálogo.',
    };
  }, [product?.type]);

  const brandOptions = useMemo(() => {
    const normalizedBrands = Array.isArray(productBrands)
      ? productBrands
          .map(({ id, name }) => ({
            value: id,
            label: typeof name === 'string' ? name.trim() : '',
          }))
          .filter(({ value, label }) => value && label)
      : [];

    const options = [
      {
        value: BRAND_DEFAULT_OPTION_VALUE,
        label: PRODUCT_BRAND_DEFAULT,
      },
      ...normalizedBrands,
    ];

    const hasLegacyBrand = Boolean(
      !product?.brandId &&
        product?.brand &&
        product.brand !== PRODUCT_BRAND_DEFAULT,
    );

    if (hasLegacyBrand) {
      options.push({
        value: BRAND_LEGACY_OPTION_VALUE,
        label: product.brand,
      });
    }

    return options;
  }, [productBrands, product?.brand, product?.brandId]);

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
        <Col
          span={24}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr min-content',
            gap: '0.2em',
          }}
        >
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
                (option?.label || '')
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label={' '}>
            <Button
              icon={icons.operationModes.add}
              onClick={handleOpenBrandModal}
            ></Button>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="size" label="Tamaño">
            <Input placeholder="Ingresa el tamaño" />
          </Form.Item>
        </Col>
        <Col
          span={12}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr min-content',
            gap: '0.2em',
          }}
        >
          <Form.Item name="category" label={'Categoría'}>
            <Select
              showSearch
              placeholder="Selecciona una categoría"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              defaultValue="none"
            >
              <Option key="none" value="none">
                Ninguna
              </Option>
              {categories.map(({ category }) => (
                <Option key={category?.name} value={category.name}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={' '}>
            <Button
              icon={icons.operationModes.add}
              onClick={configureAddProductCategoryModal}
            ></Button>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col
          span={12}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr min-content',
            gap: '0.2em',
          }}
        >
          <Form.Item name="activeIngredients" label={'Principio Activo'}>
            <Select
              showSearch
              placeholder="Selecciona el principio activo"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
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
          </Form.Item>
          <Form.Item label={' '}>
            <Button
              icon={icons.operationModes.add}
              onClick={handleOpenActiveIngredientModal}
            ></Button>
          </Form.Item>
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
