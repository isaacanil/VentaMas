import { Checkbox, Divider, Typography } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const { Title, Text } = Typography;

type FieldSelectorProps = {
  essentialFields: string[];
  optionalGroups: Record<string, string[]>;
  onFieldsChange: (fields: string[]) => void;
  language?: string;
};

type CheckboxValueType = string | number;

const FieldSelector = ({
  essentialFields,
  optionalGroups,
  onFieldsChange,
}: FieldSelectorProps) => {
  // Aplanar todos los campos opcionales en una sola lista
  const flattenedOptionalFields = Object.values(optionalGroups).flat();

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);

  useEffect(() => {
    // Notificar al componente padre sobre los cambios
    onFieldsChange(selectedFields);
  }, [selectedFields, onFieldsChange]);

  const handleChange = (checkedValues: CheckboxValueType[]) => {
    const values = checkedValues.map(String);
    setSelectedFields(values);
    setIndeterminate(
      !!values.length && values.length < flattenedOptionalFields.length,
    );
    setCheckAll(values.length === flattenedOptionalFields.length);
  };

  const handleCheckAllChange = (e: CheckboxChangeEvent) => {
    setSelectedFields(e.target.checked ? [...flattenedOptionalFields] : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <Container>
      <div>
        <Title level={5}>Campos esenciales</Title>
        <Text type="secondary">
          Los siguientes campos siempre se incluirán en la plantilla:
        </Text>
        <EssentialList>
          {essentialFields.map((field) => (
            <EssentialField key={field}>{field}</EssentialField>
          ))}
        </EssentialList>
      </div>

      <Divider />

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={5}>Campos opcionales</Title>
          <Checkbox
            indeterminate={indeterminate}
            onChange={handleCheckAllChange}
            checked={checkAll}
          >
            Seleccionar todos
          </Checkbox>
        </div>

        <Text type="secondary">
          Selecciona los campos adicionales que deseas incluir:
        </Text>

        <CheckboxGroup
          options={flattenedOptionalFields.map((field) => ({
            label: field,
            value: field,
          }))}
          value={selectedFields}
          onChange={handleChange}
        />
      </div>
    </Container>
  );
};

export default FieldSelector;

const Container = styled.div`
  margin: 20px 0;
`;

const EssentialList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
`;

const EssentialField = styled.div`
  padding: 4px 8px;
  font-size: 0.9em;
  background-color: #f0f0f0;
  border-radius: 4px;
`;

const CheckboxGroup = styled(Checkbox.Group)`
  display: flex;
  flex-direction: column;
  max-height: 300px;
  padding: 10px 0;
  margin-top: 10px;
  overflow-y: auto;

  .ant-checkbox-wrapper {
    margin: 5px 0;
  }
`;
