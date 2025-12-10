import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="small"
              style={{ marginRight: '8px' }}
            />
          </Tooltip>
          <Button
            type="link"
            danger
            onClick={handleDelete}
            icon={<DeleteOutlined />}
            size="small"
          />
        </div>
      </CardHeader>
      <CardFooter>
        <p>Cantidad: {unit?.quantity}</p>
        <p>Precio: {formatPriceit?.pricing?.listPrice)}</p>
      </CardFooter>
    </CustomCardContainer>
  );
};
