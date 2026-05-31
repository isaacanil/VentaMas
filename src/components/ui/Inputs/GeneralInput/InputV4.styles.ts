import styled from 'styled-components';

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

interface InputButtonProps {
  $isFirst?: boolean;
  $isLast?: boolean;
  $size?: string;
  $color?: string;
}

export const Asterisk = styled.span`
  padding-left: 8px;
  color: red;

  svg {
    font-size: 0.8em;
  }
`;

export const Backdrop = styled.div<{ $marginBottom?: boolean }>`
  position: relative;
  ${({ $marginBottom }) =>
    $marginBottom &&
    `
    margin-bottom: 1em;
  `}
`;

export const Header = styled.div`
  display: flex;
`;

export const Container = styled.div`
  display: flex;
  width: 100%;
`;

export const Icon = styled.div`
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

export const ClearIcon = styled(Icon)<{ $hasValue: boolean }>`
  position: relative;
  z-index: 100;
  margin-left: 8px;
  color: ${({ $hasValue }) => ($hasValue ? '#999' : 'transparent')};
  cursor: pointer;
`;

export const ButtonIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 6px;
`;

export const PasswordToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  cursor: pointer;
`;

export const ButtonsContainer = styled.div<{
  $alignment?: string;
  $size?: string;
}>`
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

export const InputWrapper = styled.div.attrs(() => ({
  tabIndex: 0,
}))<InputWrapperProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgb(51 51 51);
  border-radius: ${(props) => (props.$hasButtons ? '4px 0 0 4px' : '4px')};

  &:focus-within {
    ${(props) =>
      props.disabled || props.readOnly
        ? null
        : `
    outline: 2px solid #6b93ff;
    `}
  }

  position: relative;
  width: 100%;
  max-width: ${(props) => (props.$search ? '280px' : 'none')};
  height: 2em;
  padding: 0 2px;
  background: ${(props) => props.$bgColor || 'white'};
  transition:
    all 0.3s ease,
    width 0.3ms linear;

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
  }

  input[type='date'] {
    width: min-content !important;
  }

  border: ${(props) => {
    if (props.$validate === true) {
      return '1px solid #00c853';
    } else if (props.$validate === false) {
      return '1px solid #ff3547';
    } else {
      return '1px solid #ccc';
    }
  }};

  ${(props) =>
    props.disabled &&
    `
    background-color: #f8f8f8;
    color: #999;
  `}

  ${(props) => {
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

  ${(props) => {
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

export const StyledInput = styled.input<{ disabled?: boolean }>`
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0 4px;
  font-size: 16px;
  font-weight: inherit;
  color: inherit;
  background-color: transparent;
  border: none;
  outline: none;

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

  ${({ disabled }) =>
    disabled &&
    `
    background-color: transparent;
  `}
`;

export const InputButton = styled.button<InputButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  border-radius: ${(props) => {
    if (props.$isFirst && props.$isLast) return '0 4px 4px 0';
    if (props.$isFirst) return '0';
    if (props.$isLast) return '0 4px 4px 0';
    return '0';
  }};

  border-left: ${(props) =>
    !props.$isFirst ? '1px solid rgba(0,0,0,0.1)' : 'none'};

  ${(props) => {
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

  ${(props) => {
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

export const Label = styled.label<{ $labelVariant?: string }>`
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--gray-5);

  ${(props) => {
    switch (props.$labelVariant) {
      case 'primary':
        return `
          font-size: 11px;
          color: #353535;
          position: absolute;
          z-index: 1;
          background-color: white;
          padding: 0 4px;
          top: -5px;
          line-height: 1;
          height: min-content;
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

export const ErrorContainer = styled.ul`
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

export const ErrorMessage = styled.li<{ $show?: boolean }>`
  display: ${({ $show }) => ($show ? 'inline' : 'hidden')};
  margin-left: 8px;
  font-size: 14px;
  color: #ff3547;

  ::before {
    height: 100%;
    font-size: large;
    font-weight: bold;
    color: #ff3547;
    content: '\\2022 ';
  }
`;
