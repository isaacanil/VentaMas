import { List, Space, Typography } from 'antd';

import type { TokenResultItem } from '../types';

const { Text } = Typography;

interface SessionTokensCleanupResultsProps {
  tokens: TokenResultItem[];
}

export function SessionTokensCleanupResults({
  tokens,
}: SessionTokensCleanupResultsProps) {
  return (
    <List
      bordered
      dataSource={tokens}
      locale={{ emptyText: 'Sin tokens para eliminar' }}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={<Text code>{item.id}</Text>}
            description={
              <Space orientation="vertical">
                <Text>
                  <Text strong>ID de usuario:</Text> {item.userId}
                </Text>
                <Text type="secondary">
                  Campos presentes: {item.keys.join(', ') || 'ninguno'}
                </Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}
