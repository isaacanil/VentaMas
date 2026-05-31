import {
  faCheckCircle,
  faShop,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';

import type { BusinessSeedData } from '../types';

import {
  BusinessAddress,
  BusinessName,
  CardContent,
  CreatedBusinessId,
  HeaderRow,
  ShopIcon,
  ShopIconBox,
  SuccessBox,
  SuccessIcon,
  SuccessText,
  SummaryCard,
  UserEmail,
  UserIcon,
  UserIconBox,
  UserInfo,
  UserName,
  UserRoleTag,
  UserRow,
  UsersSection,
  UsersTitle,
} from './BusinessInfoCard.styles';

interface BusinessInfoCardProps {
  data?: BusinessSeedData | null;
  success?: boolean;
}

const BusinessInfoCard: React.FC<BusinessInfoCardProps> = ({
  data,
  success,
}) => {
  if (!data?.business) return null;

  return (
    <SummaryCard>
      <CardContent>
        <HeaderRow>
          <ShopIconBox>
            <ShopIcon icon={faShop} />
          </ShopIconBox>
          <div>
            <BusinessName strong>
              {data.business?.name || 'Sin nombre'}
            </BusinessName>
            <BusinessAddress type="secondary">
              {data.business?.address || 'Sin direccion'}
            </BusinessAddress>
          </div>
        </HeaderRow>

        <UsersSection>
          <UsersTitle type="secondary">
            USUARIOS ({data.users?.length || 0})
          </UsersTitle>
          {data.users?.map((user) => (
            <UserRow
              key={`${user.email ?? user.name}-${user.role ?? 'sin-rol'}`}
            >
              <UserIconBox>
                <UserIcon icon={faUser} />
              </UserIconBox>
              <UserInfo>
                <UserName>{user.name}</UserName>
                <UserEmail type="secondary">{user.email}</UserEmail>
              </UserInfo>
              <UserRoleTag>{user.role || 'Usuario'}</UserRoleTag>
            </UserRow>
          ))}
        </UsersSection>

        {success && data.createdBusinessId && (
          <SuccessBox>
            <SuccessText>
              <SuccessIcon icon={faCheckCircle} />
              Negocio creado exitosamente
            </SuccessText>
            <CreatedBusinessId code>{data.createdBusinessId}</CreatedBusinessId>
          </SuccessBox>
        )}
      </CardContent>
    </SummaryCard>
  );
};

export default BusinessInfoCard;
