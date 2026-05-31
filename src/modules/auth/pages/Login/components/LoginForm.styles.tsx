import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form } from 'antd';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { FormProps } from 'antd';

export interface LoginFormValues {
  username: string;
  password: string;
}

export type OnFinishFailedInfo = Parameters<
  NonNullable<FormProps<LoginFormValues>['onFinishFailed']>
>[0];

const ACCENT_COLOR = 'var(--color)';

export const Container = styled.div`
  display: grid;
  align-items: start;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 0;
  padding-bottom: 1.4em;
  overflow-y: auto;
  scrollbar-color: rgb(255 255 255 / 20%) transparent;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(255 255 255 / 20%);
    border: transparent;
    border-radius: 20px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgb(255 255 255 / 30%);
  }

  @media (height >= 980px) {
    align-content: center;
    align-items: center;
    padding: 2rem 1.5rem;
  }

  @media (width <= 800px) {
    padding-top: 0.25rem;
    padding-right: 0.75rem;
    padding-bottom: 1rem;
    padding-left: 0.75rem;
  }
`;

export const Wrapper = styled.div`
  flex-shrink: 0;
  width: 100%;
  max-width: 450px;
  padding: 0;
  border-radius: 1em;
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  font-size: 1rem;
  color: rgb(255 255 255 / 70%);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
`;

const InputElement = styled.input`
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  line-height: 1.2;
  color: #fff;
  background: transparent;
  border: none;

  &::placeholder {
    color: rgb(255 255 255 / 50%);
  }

  &:focus {
    outline: none;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-text-fill-color: #fff !important;
    transition: background-color 5000s ease-in-out 0s;
    box-shadow: 0 0 0 1000px #1f1f1f inset !important;
  }
`;

const IconInputWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    background: rgb(255 255 255 / 2%);
    border-color: rgb(255 255 255 / 30%);
  }

  &:focus-within {
    background: rgb(255 255 255 / 5%);
    border-color: ${ACCENT_COLOR};
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color) 20%, transparent);
  }

  &:focus-within ${StyledIcon} {
    color: ${ACCENT_COLOR};
    transform: translateY(-1px);
  }

  &:focus-within ${InputElement}::placeholder {
    color: rgb(255 255 255 / 80%);
  }
`;

type IconInputProps = {
  icon: IconDefinition;
  endSlot?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, endSlot, ...inputProps }, ref) => (
    <IconInputWrapper>
      <StyledIcon icon={icon} />
      <InputElement ref={ref} {...inputProps} />
      {endSlot}
    </IconInputWrapper>
  ),
);

IconInput.displayName = 'IconInput';

export const TogglePasswordButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  color: rgb(255 255 255 / 70%);
  cursor: pointer;
  background: transparent;
  border: none;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateY(-1px);
  }

  &:focus-visible {
    border-radius: 999px;
    outline: 2px solid ${ACCENT_COLOR};
    outline-offset: 2px;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const SubmitButton = styled.button`
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f1323;
  letter-spacing: 0.02em;
  cursor: pointer;
  background: ${ACCENT_COLOR};
  border: none;
  border-radius: 999px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;

  &:hover {
    box-shadow: 0 12px 24px color-mix(in srgb, var(--color) 28%, transparent);
    filter: brightness(1.05);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 8px 18px color-mix(in srgb, var(--color) 18%, transparent);
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: none;
    transform: none;
    box-shadow: none;
  }
`;

export const LoadingSpinner = styled.span`
  display: inline-block;
  flex-shrink: 0;
  width: 1.1em;
  height: 1.1em;
  vertical-align: middle;
  border: 2px solid rgb(15 19 35 / 20%);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

type StyledLoginFormProps = Omit<FormProps<LoginFormValues>, 'children'> & {
  children?: ReactNode;
};

const BaseLoginForm = (props: StyledLoginFormProps) => (
  <Form<LoginFormValues> {...props} />
);

export const StyledForm = styled(BaseLoginForm)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  height: 100%;
  color: white;

  label {
    font-weight: 500;
    color: white !important;
  }

  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item + .ant-form-item {
    margin-top: 0;
  }

  .ant-select .ant-select-selector {
    border-radius: 8px !important;
  }

  .ant-form-item-explain-error {
    display: none;
  }
`;

export const FormErrorMessage = styled.div`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffb4b4;
  text-align: center;
  background: rgb(255 87 87 / 18%);
  border-radius: 8px;
`;

export const RegisterLink = styled(Link)`
  display: inline-flex;
  justify-content: center;
  width: 100%;
  margin-top: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #c8fff2;
  text-decoration: none;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`;
