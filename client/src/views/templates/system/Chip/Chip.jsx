import React from 'react';
import styled from 'styled-components';

const getSizeStyles = size => {
  switch (size) {
    case 'small':
      return `
        padding: 2px 8px;
        border-radius: 12px;
      `;
    case 'medium':
      return `
        padding: 8px 12px;
        border-radius: 16px;
      `;
    default:
      return `
        padding: 8px 12px;
        border-radius: 16px;
      `;
  }
};

const ChipContainer = styled.div`
  display: flex;
  align-items: center;
  width: min-content;
  svg{
    display: flex;
    align-items: center;
  }
  ${(props) => getSizeStyles(props.size)}
  background-color: ${(props) => props.disabled ? '#e0dede' : (props.theme.colors[props.bgColor]["bg"] || '#e0e0e0')};
  cursor: ${(props) => (props.clickable && !props.disabled ? 'pointer' : 'default')};
`;

const ChipIcon = styled.div`
  ${props => props.disabled && 'opacity: 0.5;'}
  color: ${(props) => (props.disabled ? '#4b4b4b' : props.theme.colors[props.color]["text"])};
  margin-right: 8px;
`;

const ChipLabel = styled.span`
  ${(props) => (props.size === 'small' ? 'font-size: 16px;' : 'font-size: 14px;')}
  color: ${(props) => (props.disabled ? '#4b4b4b' : props.theme.colors[props.color]["text"])};
`;

const DeleteIcon = styled.div`
  margin-left: 8px;
  cursor: pointer;
`;

export const Chip = ({
  icon,
  label,
  size = 'medium',
  onDelete,
  clickable = false,
  color = '#e0e0e0',
  disabled = false,  // Default value in case disabled prop is not provided
}) => {
  return (
    <ChipContainer bgColor={color} clickable={clickable} size={size} disabled={disabled}>
      {icon && (
        <ChipIcon
        color={color}
          disabled={disabled}
        >
          {icon}
        </ChipIcon>)
      }
      <ChipLabel
        size={size}
        disabled={disabled}
        color={color}
      >
        {label}
      </ChipLabel>
      {onDelete && !disabled && (
        <DeleteIcon onClick={onDelete}>
          {/* Replace with your delete icon */}
          X
        </DeleteIcon>
      )}
    </ChipContainer>
  );
};

// Usage:
// <Chip icon={<YourIcon />} label="Example Chip" onDelete={() => alert('Delete clicked')} clickable size="small" disabled />
