import { Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

const { Text } = Typography;

const CodeStructureContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
`;

const CodePart = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  padding: 12px 8px;
  background: ${(props) => props.color};
  border: 1px solid ${(props) => props.border};
  border-radius: 4px;

  .code-value {
    margin-bottom: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', Monaco, monospace;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
  }

  .code-label {
    font-size: 10px;
    font-weight: 500;
    line-height: 1.2;
    color: #8c8c8c;
    text-align: center;
  }
`;

const InfoSection = styled.div`
  padding-top: 12px;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  font-size: 11px;
  color: #595959;
`;

const InfoLabel = styled.div`
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
`;

const InfoValue = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', Monaco, monospace;
  color: #595959;
  text-align: right;
`;

const StructureTitle = styled.div`
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #262626;
  text-align: center;
`;

export const CodeStructure = ({ selectedConfig }) => {
  if (!selectedConfig || !selectedConfig.companyPrefix) return null;

  // Generar el código completo de ejemplo
  const gs1Prefix = '746';
  const companyPrefix = selectedConfig.companyPrefix;
  const itemReference = '0'.repeat(selectedConfig.itemReferenceLength);
  const checkDigit = 'X';
  const fullCode = `${gs1Prefix}${companyPrefix}${itemReference}${checkDigit}`;

  return (
    <div>
      <StructureTitle>Ejemplo: {fullCode}</StructureTitle>

      <CodeStructureContainer>
        <CodePart color="#f0f8ff" border="#d6e4ff">
          <Text className="code-value">{gs1Prefix}</Text>
          <Text className="code-label">GS1 RD</Text>
        </CodePart>

        <CodePart color="#f6ffed" border="#b7eb8f">
          <Text className="code-value">{companyPrefix}</Text>
          <Text className="code-label">Tu Empresa</Text>
        </CodePart>

        <CodePart color="#fff7e6" border="#ffd591">
          <Text className="code-value">{itemReference}</Text>
          <Text className="code-label">Productos</Text>
        </CodePart>

        <CodePart color="#fff1f0" border="#ffb3b3">
          <Text className="code-value">{checkDigit}</Text>
          <Text className="code-label">Check</Text>
        </CodePart>
      </CodeStructureContainer>

      <InfoSection>
        <InfoGrid>
          <InfoLabel>Código completo:</InfoLabel>
          <InfoValue>13 dígitos (GTIN-13)</InfoValue>

          <InfoLabel>Prefijo GS1 RD:</InfoLabel>
          <InfoValue>3 dígitos (746)</InfoValue>

          <InfoLabel>Tu empresa:</InfoLabel>
          <InfoValue>{selectedConfig.companyPrefixLength} dígitos</InfoValue>

          <InfoLabel>Productos:</InfoLabel>
          <InfoValue>{selectedConfig.itemReferenceLength} dígitos</InfoValue>

          <InfoLabel>Verificación:</InfoLabel>
          <InfoValue>1 dígito</InfoValue>

          <InfoLabel>Capacidad total:</InfoLabel>
          <InfoValue>
            {selectedConfig.maxProducts?.toLocaleString()} códigos
          </InfoValue>
        </InfoGrid>
      </InfoSection>
    </div>
  );
};

export default CodeStructure;
