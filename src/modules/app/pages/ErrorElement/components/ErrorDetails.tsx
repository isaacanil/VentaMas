import { Button } from '@heroui/react';
import { CopyOutlined } from '@/constants/icons/antd';
import { m, type Variants } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

interface ErrorDetailsProps {
  errorStackTrace?: string | null;
  variants?: Variants;
}

export const ErrorDetails = ({
  errorStackTrace,
  variants,
}: ErrorDetailsProps) => {
  const handleCopy = () => {
    if (!errorStackTrace) return;
    void navigator.clipboard?.writeText(errorStackTrace);
  };

  return (
    <Container variants={variants}>
      <DetailsHeader>
        <DetailsTitle>Detalles del error</DetailsTitle>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Copiar detalles del error"
          onPress={handleCopy}
          isDisabled={!errorStackTrace}
        >
          <CopyOutlined />
        </Button>
      </DetailsHeader>
      <ErrorCode>{errorStackTrace ?? 'Sin detalle disponible.'}</ErrorCode>
    </Container>
  );
};

const Container = styled(m.div)`
  display: grid;
  gap: var(--ds-space-2, 8px);
  padding: var(--ds-space-3, 12px);
  border: 1px solid var(--ds-color-border-subtle, #e4e4e7);
  border-radius: 8px;
  background: var(--ds-color-bg-surface-muted, #f8f9fa);
`;

const DetailsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2, 8px);
`;

const DetailsTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary, #18181b);
  font-size: var(--ds-font-size-sm, 0.875rem);
  font-weight: var(--ds-font-weight-semibold, 600);
  line-height: var(--ds-line-height-normal, 1.4);
`;

const ErrorCode = styled.pre`
  max-height: 200px;
  padding: 1rem;
  margin: 0;
  overflow-y: auto;
  border: 1px solid var(--ds-color-border-subtle, #e4e4e7);
  border-radius: 4px;
  background: var(--ds-color-bg-page, #f4f4f5);
  color: var(--ds-color-text-primary, #18181b);
  font-family: var(
    --ds-font-family-mono,
    ui-monospace,
    SFMono-Regular,
    Consolas,
    'Liberation Mono',
    monospace
  );
  font-size: 0.75rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--ds-color-border-strong, #a1a1aa);
    border-radius: 4px;
  }
`;
