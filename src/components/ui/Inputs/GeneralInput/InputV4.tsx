import { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode, ChangeEvent, KeyboardEvent, FocusEvent, CSSProperties } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';

export interface InputButtonConfig {
  name?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface InputV4Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  focusWhen?: any;
  icon?: ReactNode;
  label?: string;
  labelVariant?: string;
  marginBottom?: boolean;
  size?: 'small' | 'medium' | 'large';
  search?: boolean;
  onClear?: () => void;
  validate?: boolean;
  errorMessage?: string | string[];
  bgColor?: string;
  border?: boolean;
  buttons?: InputButtonConfig[];
  buttonsAlignment?: 'start' | 'end' | 'stretch';
  buttonsStyle?: CSSProperties;
  themeColor?: 'success' | 'danger';
}

const DEFAULT_ICONS: Record<string, ReactNode> = {
  date: icons.forms.date,
  password: icons.forms.password,
  email: icons.forms.email,
  search: icons.forms.search,
};

const limpiarValorCadena = (valor: string, type: string) => {
  if (type !== 'number') {
    return valor;
  }
  let v = valor.trim();
  v = v.replace(/^0+(?!\.)/, '');
  v = v.replace(/(\.\d*?[1-9])0+$/, '$1');
  v = v.replace(/\.$/, '');
  return v;
};

const limpiarValorNumero = (valor: number, type: string) => {
  if (type === 'number') {
    if (Number.isInteger(valor)) return valor;
    let valorComoCadena = valor.toString();
    valorComoCadena = valorComoCadena.replace(/(\.\d*?[1-9])0+$/, '$1');
    return Number(valorComoCadena);
  }
  return valor;
};

/**
 * Componente de entrada con soporte para botones integrados
 */
export const InputV4 = ({
  focusWhen,
  autoFocus,
  id = '',
  icon,
  label,
  labelVariant,
  marginBottom,
  size,
  search,
  onClear,
  validate,
  errorMessage,
  bgColor,
  value,
  type = 'text',
  buttons = [],
  buttonsAlignment = 'end',
  buttonsStyle,
  ...props
}: InputV4Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const defaultIcon = DEFAULT_ICONS[type] || null;
  const renderedIcon = icon || defaultIcon;
  const hasButtons = buttons && buttons.length > 0;

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (inputRef.current && focusWhen) {
      inputRef.current.focus();
    }
  }, [focusWhen]);

  const handleClearClick = () => {
    if (onClear && value) onClear();
  };

  const toggleShowPassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const limpiarValor = useCallback(
    (valor: string | number | null | undefined) => {
      if (typeof valor === 'string') {
        return limpiarValorCadena(valor, type) || '';
      } else if (typeof valor === 'number') {
        return limpiarValorNumero(valor, type) || '';
      }
      return valor ?? '';
    },
    [type],
  );

  return (
    <Backdrop $marginBottom={marginBottom}>
      <Header>
        {label && (
          <Label htmlFor={id} $labelVariant={labelVariant}>
            {label}
          </Label>
        )}
        {props.required && <Asterisk>{icons.forms.asterisk}</Asterisk>}
      </Header>

      <Container>
        <InputWrapper
          $size={size}
          $bgColor={bgColor}
          $search={search}
          $validate={validate}
          $hasButtons={hasButtons}
          $themeColor={props.themeColor}
          disabled={props.disabled}
          readOnly={props.readOnly}
        >
          {renderedIcon && <Icon>{renderedIcon}</Icon>}

          <StyledInput
            ref={inputRef}
            id={id}
            {...props}
            type={showPassword ? 'text' : type}
            autoComplete="off"
            value={limpiarValor(value as string | number)}
            onInvalid={(e: React.FormEvent<HTMLInputElement>) => {
              e.preventDefault();
              (e.target as HTMLInputElement).setCustomValidity('Por favor, complete este campo.');
            }}
          />

          {value && onClear ? (
            <Icon
              onClick={handleClearClick}
              style={{
                cursor: 'pointer',
                marginLeft: '8px',
                position: 'relative',
                zIndex: '100',
                color: `${value ? '#999' : 'transparent'}`,
              }}
            >
              {icons.operationModes.close}
            </Icon>
          ) : null}

          {type === 'password' ? (
            <PasswordToggle onClick={toggleShowPassword}>
              {showPassword
                ? icons.input.password.hide
                : icons.input.password.show}
            </PasswordToggle>
          ) : null}
        </InputWrapper>

        {hasButtons && (
          <ButtonsContainer
            $alignment={buttonsAlignment}
            style={buttonsStyle}
            $size={size}
          >
            {buttons.map((button: InputButtonConfig, index: number) => (
              <InputButton
                key={`btn-${index}`}
                onClick={button.onClick}
                disabled={button.disabled}
                $color={button.color || 'primary'}
                className={button.className}
                style={button.style}
                $isFirst={index === 0}
                $isLast={index === buttons.length - 1}
                $size={size}
                type="button"
              >
                {button.icon && <ButtonIcon>{button.icon}</ButtonIcon>}
                <span>{button.name}</span>
              </InputButton>
            ))}
          </ButtonsContainer>
        )}
      </Container>

      {validate === false && errorMessage && (
        <ErrorContainer>
          {Array.isArray(errorMessage) ? (
            errorMessage.map((message: string, index: number) => (
              <ErrorMessage key={index} $show>
                {message}
              </ErrorMessage>
            ))
          ) : (
            <ErrorMessage $show>{errorMessage}</ErrorMessage>
          )}
        </ErrorContainer>
      )}
    </Backdrop>
  );
};

const Asterisk = styled.span`

  padding-left: 8px;
  color: red;

  svg {
    font-size: 0.8em;
  }
`;

const Backdrop = styled.div<{ $marginBottom?: boolean }>`
  position: relative;
  ${({ $marginBottom }) =>
    $marginBottom &&
    `
    margin-bottom: 1em;
  `}
`;

const Header = styled.div`
  display: flex;
`;

const Container = styled.div`
  display: flex;
  width: 100%;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6em;
  height: 2em;

  svg {
    font-size: 18px;
    color: #999;
  }
`;

const ButtonIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 6px;
`;

const PasswordToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  cursor: pointer;
`;

const ButtonsContainer = styled.div<{ $alignment?: string; $size?: string }>`
  display: flex;
  align-items: ${({ $alignment }) => {
    switch ($alignment) {
      case 'start':
        return 'flex-start';
      case 'stretch':
        return 'stretch';
      case 'end':
      default:
        return 'flex-end';
    }
  }};
`;

interface InputWrapperProps {
  $hasButtons?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  $search?: boolean;
  $bgColor?: string;
  $validate?: boolean;
  $themeColor?: string;
  $size?: string;
}

const InputWrapper = styled.div.attrs(() => ({
  tabIndex: 0,
})) <InputWrapperProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgb(51 51 51);
  border-radius: ${(props: InputWrapperProps) => (props.$hasButtons ? '4px 0 0 4px' : '4px')};

  &:focus-within {
    ${(props: InputWrapperProps) =>
    props.disabled || props.readOnly
      ? null
      : `
    outline: 2px solid #6b93ff;
    `}
  }

  padding: 0 2px;
  height: 2em;
  width: 100%;
  max-width: ${(props: InputWrapperProps) => (props.$search ? '280px' : 'none')};
  position: relative;
  background: ${(props: InputWrapperProps) => props.$bgColor || 'white'};
  transition:
    all 0.3s ease,
    width 0.3ms linear;

  /* Para Chrome, Safari y Opera */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
  }

  input[type='date'] {
    width: min-content !important;
  }

  border: ${(props: InputWrapperProps) => {
    if (props.$validate === true) {
      return '1px solid #00c853';
    } else if (props.$validate === false) {
      return '1px solid #ff3547';
    } else {
      return '1px solid #ccc';
    }
  }};

  ${(props: InputWrapperProps) =>
    props.disabled &&
    `
    background-color: #f8f8f8;
    color: #999;
  `}

  ${(props: InputWrapperProps) => {
    switch (props.$themeColor) {
      case 'success':
        return `
          color: var(--color-success-dark);
          background-color: var(--color-success-light);
          font-weight: 600;
        `;
      case 'danger':
        return `
          color: var(--color-danger-dark);
          background-color: var(--color-danger-light);
          font-weight: 600;
        `;
      default:
        return '';
    }
  }}
  
  ${(props: InputWrapperProps) => {
    switch (props.$size) {
      case 'small':
        return `   
          height: 2.4em;
          font-size: 12px;  
        `;
      case 'medium':
        return `
          height: 2.6em;
          font-size: 14px;
        `;
      case 'large':
        return `
          height: 2.2em;
          font-size: 16px;
        `;
      default:
        return `
          height: 2.3em;
          font-size: 14px;
          padding: 0 8px;
        `;
    }
  }}
`;

const StyledInput = styled.input<{ disabled?: boolean }>`
  border: none;
  outline: none;
  flex: 1;
  padding: 0 4px;
  font-size: 16px;
  height: 100%;
  color: inherit;
  font-weight: inherit;
  width: 100%;

  :read-only {
    background-color: #f8f8f8;
  }

  ::-webkit-calendar-picker-indicator {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  &::placeholder {
    color: #999;
  }

  background-color: transparent;

  ${({ disabled }) =>
    disabled &&
    `
    background-color: transparent;
  `}
`;

interface InputButtonProps {
  $isFirst?: boolean;
  $isLast?: boolean;
  $size?: string;
  $color?: string;
}

const InputButton = styled.button<InputButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  height: 100%;

  /* Bordes redondeados según posición */
  border-radius: ${(props: InputButtonProps) => {
    if (props.$isFirst && props.$isLast) return '0 4px 4px 0';
    if (props.$isFirst) return '0';
    if (props.$isLast) return '0 4px 4px 0';
    return '0';
  }};

  /* Separación entre botones */
  border-left: ${(props: InputButtonProps) =>
    !props.$isFirst ? '1px solid rgba(0,0,0,0.1)' : 'none'};

  /* Tamaño del texto según el tamaño del input */
  ${(props: InputButtonProps) => {
    switch (props.$size) {
      case 'small':
        return `font-size: 12px;`;
      case 'medium':
        return `font-size: 14px;`;
      case 'large':
        return `font-size: 16px;`;
      default:
        return `font-size: 14px;`;
    }
  }}

  /* Estilos según el color */
  ${(props: InputButtonProps) => {
    switch (props.$color) {
      case 'primary':
        return `
          background: #2196f3;
          color: white;
          &:hover:not(:disabled) { background: #1976d2; }
          &:disabled { background: #bbdefb; cursor: not-allowed; }
        `;
      case 'secondary':
        return `
          background: #757575;
          color: white;
          &:hover:not(:disabled) { background: #616161; }
          &:disabled { background: #bdbdbd; cursor: not-allowed; }
        `;
      case 'success':
        return `
          background: #4caf50;
          color: white;
          &:hover:not(:disabled) { background: #388e3c; }
          &:disabled { background: #a5d6a7; cursor: not-allowed; }
        `;
      case 'danger':
        return `
          background: #f44336;
          color: white;
          &:hover:not(:disabled) { background: #d32f2f; }
          &:disabled { background: #ef9a9a; cursor: not-allowed; }
        `;
      case 'warning':
        return `
          background: #ff9800;
          color: white;
          &:hover:not(:disabled) { background: #f57c00; }
          &:disabled { background: #ffe0b2; cursor: not-allowed; }
        `;
      case 'info':
        return `
          background: #00bcd4;
          color: white;
          &:hover:not(:disabled) { background: #0097a7; }
          &:disabled { background: #b2ebf2; cursor: not-allowed; }
        `;
      case 'light':
        return `
          background: #f5f5f5;
          color: #333;
          &:hover:not(:disabled) { background: #e0e0e0; }
          &:disabled { background: #fafafa; color: #999; cursor: not-allowed; }
        `;
      case 'dark':
        return `
          background: #212121;
          color: white;
          &:hover:not(:disabled) { background: #000; }
          &:disabled { background: #757575; cursor: not-allowed; }
        `;
      default:
        return `
          background: #f5f5f5;
          color: #333;
          &:hover:not(:disabled) { background: #e0e0e0; }
          &:disabled { background: #fafafa; color: #999; cursor: not-allowed; }
        `;
    }
  }}
`;

const Label = styled.label<{ $labelVariant?: string }>`
  font-size: 13px;
  color: var(--gray-5);
  margin-bottom: 4px;

  ${(props: { $labelVariant?: string }) => {
    switch (props.$labelVariant) {
      case 'primary':
        return `
          font-size: 11px;
          color: var(--gray-5);
          position: absolute;
          z-index: 1;
          background-color: white;
          padding: 0 4px;
          top: -5px;
          line-height: 1;
          height: min-content;
          color: #353535;
          font-weight: 600;
          ::after {
            content: ' :';
          }
        `;
      case 'label1':
        return `
          font-size: 14px;
          color: var(--gray-5);
          margin-bottom: 4px;
        `;
      case 'label2':
        return `
          font-size: 16px;
          color: black;
          margin-bottom: 10px;
          display: block;
        `;
      case 'label3':
        return `
          font-size: 12px;
          line-height: 12px;
          display: flex;
          font-weight: 500;
          color: black;
          min-width: 2em;
          height: 1em;
          padding: 0em 0em 0em 0.4em;
          align-items: end;
        `;
      default:
        return `
          font-size: 13px;
          color: var(--gray-5);
          margin-bottom: 4px;
        `;
    }
  }}
`;

const ErrorContainer = styled.ul`
  display: grid;
  gap: 2px;
  padding: 0;
  margin-top: 4px;
  margin-bottom: 4px;
  list-style-position: inside !important;
  list-style-type: circle !important;
  background-color: var(--color-danger-light);
  border-radius: var(--border-radius-light);
`;

const ErrorMessage = styled.li<{ $show?: boolean }>`
  display: ${({ $show }: { $show?: boolean }) => ($show ? 'inline' : 'hidden')};
  margin-left: 8px;
  font-size: 14px;
  color: #ff3547;

  ::before {
    height: 100%;
    font-size: large;
    font-weight: bold;
    color: #ff3547;
    content: '• ';
  }
`;
