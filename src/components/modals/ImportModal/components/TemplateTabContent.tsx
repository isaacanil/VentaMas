import { FileAddOutlined } from '@/constants/icons/antd';
import { Button } from 'antd';
import styled from 'styled-components';

import FieldSelector from '../FieldSelector';
import type { ImportLanguage } from '../types';

interface TemplateTabContentProps {
  essentialFields: string[];
  language: ImportLanguage;
  onCreateTemplateClick: () => void;
  onFieldsChange: (fields: string[]) => void;
  optionalGroups: Record<string, string[]>;
}

export const TemplateTabContent = ({
  essentialFields,
  language,
  onCreateTemplateClick,
  onFieldsChange,
  optionalGroups,
}: TemplateTabContentProps) => {
  return (
    <Section>
      <p>
        Crea una plantilla personalizada seleccionando los campos que
        necesitas.
      </p>
      <p>Los campos esenciales siempre se incluirán en la plantilla.</p>

      <FieldSelector
        essentialFields={essentialFields}
        optionalGroups={optionalGroups}
        onFieldsChange={onFieldsChange}
        language={language}
      />

      <Button
        type="primary"
        onClick={onCreateTemplateClick}
        icon={<FileAddOutlined />}
      >
        Crear Plantilla
      </Button>
    </Section>
  );
};

const Section = styled.div`
  margin-bottom: 2em;

  p {
    margin-bottom: 1em;
  }
`;
