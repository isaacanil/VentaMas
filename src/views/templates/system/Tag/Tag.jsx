import * as antd from 'antd'
import React from 'react'

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

