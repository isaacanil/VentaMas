import { Tooltip } from 'antd';
import React from 'react';

interface ActionIconProps {
    icon: React.ReactNode;
    onClick: () => void;
    tooltip: string;
    color?: string;
    hoverColor?: string;
}

export const ActionIcon = ({ icon, onClick, tooltip, color = '#8c8c8c', hoverColor = '#1890ff' }: ActionIconProps) => {
    return (
        <Tooltip title={tooltip}>
            <div
                onClick={onClick}
                style={{
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    transition: 'all 0.3s',
                    color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.color = hoverColor;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = color;
                }}
            >
                {icon}
            </div>
        </Tooltip>
    );
};
