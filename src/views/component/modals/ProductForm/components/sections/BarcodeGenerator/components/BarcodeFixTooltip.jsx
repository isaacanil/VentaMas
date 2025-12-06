import * as ant from 'antd';
import React from 'react';
import styled from 'styled-components';

/**
 * BarcodeFixTooltip
 * ------------------
 * Tooltip flotante inline que aparece debajo del input cuando el código de barras es inválido.
 * Muestra el código actual, el código corregido y acciones para aplicar o copiar la corrección.
 *
 * Props:
 *  - visible: boolean -> controla la visibilidad del tooltip
 *  - currentCode: string -> código ingresado actualmente
 *  - suggestion: { fixed: string, reason?: string, type?: string } | null -> sugerencia calculada
 *  - onApply(code: string): void -> callback para aplicar la corrección
 *  - onCopy?(code: string): void -> opcional, se llama al copiar
 *  - onClose(): void -> cerrar el tooltip
 *  - placement?: 'left' | 'right' | 'center' -> alineación horizontal respecto al input
 *  - zIndex?: number
 *  - maxWidth?: number
 *
 * Uso típico:
 *  <InputWrapper>
 *    <Input ... onFocus={() => setOpen(true)} onBlur={...} />
 *    <BarcodeFixTooltip
 *      visible={open && suggestion}
 *      currentCode={value}
 *      suggestion={suggestion}
 *      onApply={handleApply}
 *      onClose={() => setOpen(false)}
 *    />
 *  </InputWrapper>
 */

const { Button, message } = ant;

// ----- styled components -----
const Container = styled.div`
  background: #fff;
  border: 1px solid #ffd666;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
  font-size: 13px;
  margin-top: 4px;
  max-width: ${(p) => p.$maxWidth || 340}px;
  min-width: 280px;
  padding: 16px;
  position: absolute;
  top: 100%;
  z-index: ${(p) => p.$zIndex || 20};
  ${(p) =>
    p.$placement === 'right'
      ? 'right: 0;'
      : p.$placement === 'center'
        ? 'left: 50%; transform: translateX(-50%);'
        : 'left: 0;'}
`;

const Title = styled.div`
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  text-align: center;
`;

const SuggestionText = styled.div`
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  text-align: center;
`;

const Row = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 18px;
  font-weight: 600;
`;

const CurrentCode = styled.span`
  color: #262626;
`;

const Plus = styled.span`
  margin: 0 6px;
  font-size: 20px;
  color: #1890ff;
`;

const CheckDigit = styled.span`
  padding: 3px 6px;
  color: #52c41a;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export default function BarcodeFixTooltip({
  visible,
  currentCode,
  suggestion,
  onApply,
  onCopy,
  onClose,
  placement = 'left',
  zIndex,
  maxWidth,
}) {
  if (!visible || !suggestion) return null;

  // Extraer el dígito verificador (último dígito del código corregido)
  const checkDigit = suggestion.fixed.slice(-1);
  const baseCode = currentCode || suggestion.fixed.slice(0, -1);

  const handleApply = () => {
    onApply?.(suggestion.fixed);
    onClose?.();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.fixed);
      message.success('Copiado');
      onCopy?.(suggestion.fixed);
    } catch (error) {
      message.error(
        `No se pudo copiar${error?.message ? `: ${error.message}` : ''}`,
      );
    }
  };

  // Evitar que el blur del input cierre el tooltip antes de hacer click
  const stopMouseDown = (e) => e.preventDefault();

  return (
    <Container
      $placement={placement}
      $zIndex={zIndex}
      $maxWidth={maxWidth}
      onMouseDown={stopMouseDown}
    >
      <Title>Sugerencia</Title>

      <SuggestionText>Agregar dígito verificador</SuggestionText>

      <Row>
        <CurrentCode>{baseCode}</CurrentCode>
        <Plus>+</Plus>
        <CheckDigit>{checkDigit}</CheckDigit>
      </Row>

      <Actions>
        <Button size="small" onClick={handleCopy}>
          Copiar
        </Button>
        <Button size="small" type="text" onClick={onClose}>
          Cerrar
        </Button>
        <Button type="primary" size="small" onClick={handleApply}>
          Aplicar
        </Button>
      </Actions>
    </Container>
  );
}
