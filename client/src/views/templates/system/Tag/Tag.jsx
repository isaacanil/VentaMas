import React from 'react'
import * as antd from 'antd'
export const Tag = ({ color, children }) => {
    return (
        <antd.Tag
            style={{ fontSize: "16px", padding: "5px" }}
            color={color}
            title='Hola'
        >
            {children}
        </antd.Tag>
    )
}

