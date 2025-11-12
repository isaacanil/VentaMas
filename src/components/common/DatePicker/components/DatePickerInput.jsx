import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import React from 'react';
import styled from 'styled-components';

const StyledInput = styled(Input)`
    cursor: pointer;
    
    input {
        cursor: pointer !important;
        color: ${props => props.$hasValue ? 'inherit' : '#bfbfbf'} !important;
    }
    
    &:hover {
        border-color: #40a9ff;
    }
    
    &:focus-within {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
`;

const ClearIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #bfbfbf;
    color: white;
    cursor: pointer;
    font-size: 10px;
    transition: all 0.3s;
    
    &:hover {
        background: #8c8c8c;
    }
`;

export const DatePickerInput = ({
    value,
    placeholder,
    size,
    disabled,
    allowClear,
    hasValue,
    onClear,
    onClick,
    ...props
}) => {
    return (
        <StyledInput
            value={hasValue ? value : ''}
            placeholder={placeholder}
            readOnly
            onClick={() => !disabled && onClick()}
            size={size}
            disabled={disabled}
            prefix={<CalendarOutlined />}
            suffix={
                allowClear && hasValue ? (
                    <ClearIcon onClick={onClear}>
                        <CloseOutlined />
                    </ClearIcon>
                ) : null
            }
            $hasValue={hasValue}
            {...props}
        />
    );
}; 