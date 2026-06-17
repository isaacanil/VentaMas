import styled from 'styled-components';
import type { ReactNode } from 'react';

type PurchasePillTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

type PurchasePillBaseProps = {
  children: ReactNode;
  label?: ReactNode;
  tone?: PurchasePillTone;
  className?: string;
};

type PurchasePillReadOnlyProps = PurchasePillBaseProps & {
  interactive?: false;
};

type PurchasePillButtonProps = PurchasePillBaseProps & {
  interactive: true;
  onClick: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
};

export type PurchasePillProps =
  | PurchasePillReadOnlyProps
  | PurchasePillButtonProps;

const TONE_COLOR: Record<PurchasePillTone, string> = {
  neutral: '#434343',
  brand: '#1677ff',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
};

export const PurchasePill = (props: PurchasePillProps) => {
  const tone = props.tone ?? 'neutral';
  const hasLabel = props.label != null;

  if (props.interactive) {
    return (
      <ButtonPill
        type={props.type ?? 'button'}
        $tone={tone}
        className={props.className}
        onClick={props.onClick}
        disabled={props.disabled}
        aria-label={props.ariaLabel}
      >
        {hasLabel ? (
          <PillStack>
            <PillLabel>{props.label}</PillLabel>
            <PillValue>{props.children}</PillValue>
          </PillStack>
        ) : (
          props.children
        )}
      </ButtonPill>
    );
  }

  return (
    <ReadOnlyPill $tone={tone} className={props.className}>
      {hasLabel ? (
        <PillStack>
          <PillLabel>{props.label}</PillLabel>
          <PillValue>{props.children}</PillValue>
        </PillStack>
      ) : (
        props.children
      )}
    </ReadOnlyPill>
  );
};

const pillStyles = `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  border: 1px solid transparent;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
`;

const ReadOnlyPill = styled.span<{ $tone: PurchasePillTone }>`
  ${pillStyles}
  color: ${({ $tone }) => ($tone === 'neutral' ? '#434343' : TONE_COLOR[$tone])};
  background: ${({ $tone }) => ($tone === 'neutral' ? '#ffffff' : `${TONE_COLOR[$tone]}12`)};
  border-color: ${({ $tone }) => ($tone === 'neutral' ? '#d9d9d9' : `${TONE_COLOR[$tone]}22`)};
`;

const ButtonPill = styled.button<{ $tone: PurchasePillTone }>`
  ${pillStyles}
  width: fit-content;
  cursor: pointer;
  color: ${({ $tone }) => ($tone === 'neutral' ? '#434343' : TONE_COLOR[$tone])};
  background: ${({ $tone }) => ($tone === 'neutral' ? '#ffffff' : `${TONE_COLOR[$tone]}12`)};
  border-color: ${({ $tone }) => ($tone === 'neutral' ? '#d9d9d9' : `${TONE_COLOR[$tone]}22`)};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
    border-color: ${({ $tone }) =>
      $tone === 'neutral' ? '#bfbfbf' : `${TONE_COLOR[$tone]}55`};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const PillStack = styled.span`
  display: grid;
  gap: 2px;
  line-height: 1.1;
`;

const PillLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
`;

const PillValue = styled.span`
  font-size: 13px;
  font-weight: 600;
`;
