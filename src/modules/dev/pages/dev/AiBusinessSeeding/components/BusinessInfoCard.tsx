import {
  faCheckCircle,
  faShop,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { BusinessSeedData } from '../types';

const { Text } = Typography;

const SummaryCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 3%);
  border: 1px solid #f0f0f0;
`;

const Tag = styled.span`
  background: #e6f7ff;
  color: #1890ff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
`;

interface BusinessInfoCardProps {
  data?: BusinessSeedData | null;
  success?: boolean;
}

const BusinessInfoCard: React.FC<BusinessInfoCardProps> = ({ data, success }) => {
  if (!data?.business) return null;

  return (
    <SummaryCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: '#e6f7ff',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesomeIcon
              icon={faShop}
              style={{ color: '#1890ff', fontSize: 18 }}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>
              {data.business?.name || 'Sin nombre'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.business?.address || 'Sin dirección'}
            </Text>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <Text
            type="secondary"
            style={{ fontSize: 11, display: 'block', marginBottom: 8 }}
          >
            USUARIOS ({data.users?.length || 0})
          </Text>
          {data.users?.map((user, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid #fafafa',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: '#f0f0f0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesomeIcon
                  icon={faUser}
                  style={{ color: '#999', fontSize: 12 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, display: 'block' }}>
                  {user.name}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {user.email}
                </Text>
              </div>
              <Tag style={{ fontSize: 10 }}>{user.role || 'Usuario'}</Tag>
            </div>
          ))}
        </div>

        {success && data.createdBusinessId && (
          <div
            style={{
              background: '#f6ffed',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #b7eb8f',
            }}
          >
            <Text style={{ fontSize: 11, color: '#52c41a', display: 'block' }}>
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{ marginRight: 6 }}
              />
              Negocio creado exitosamente
            </Text>
            <Text code style={{ fontSize: 11 }}>
              {data.createdBusinessId}
            </Text>
          </div>
        )}
      </div>
    </SummaryCard>
  );
};

export default BusinessInfoCard;
