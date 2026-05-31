import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

import { icons } from '@/constants/icons/icons';

import {
  Asterisk,
  Backdrop,
  ButtonIcon,
  ButtonsContainer,
  ClearIcon,
  Container,
  ErrorContainer,
  ErrorMessage,
  Header,
  Icon,
  InputButton,
  InputWrapper,
  Label,
  PasswordToggle,
  StyledInput,
} from './InputV4.styles';

export interface InputButtonConfig {
  name?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface InputV4Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
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

const EMPTY_INPUT_BUTTONS: InputButtonConfig[] = [];

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
  buttons = EMPTY_INPUT_BUTTONS,
  buttonsAlignment = 'end',
  buttonsStyle,
  ...props
}: InputV4Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const defaultIcon = DEFAULT_ICONS[type] || null;
  const renderedIcon = icon || defaultIcon;
  const hasButtons = buttons.length > 0;

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
            onInvalid={(event: FormEvent<HTMLInputElement>) => {
              event.preventDefault();
              event.currentTarget.setCustomValidity(
                'Por favor, complete este campo.',
              );
            }}
          />

          {value && onClear ? (
            <ClearIcon onClick={handleClearClick} $hasValue={Boolean(value)}>
              {icons.operationModes.close}
            </ClearIcon>
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
                key={button.name ?? button.className ?? button.color ?? 'button'}
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
            errorMessage.map((message: string) => (
              <ErrorMessage key={message} $show>
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
