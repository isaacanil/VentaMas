import * as antd from 'antd'
const { ConfigProvider } = antd
import React from 'react'
const modalCustomStyles = {
    // Estilos para el "backdrop"
    mask: {
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
    },
  };
export const AntConfigProvider = ({ children }) => {
    return (
        <ConfigProvider
            theme={{
                components: {
                    Modal: modalCustomStyles,
                },
            }}
        >
            {children}
        </ConfigProvider>
    )
}
