import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

export const SummaryCard = styled.div`
  padding: 1.5rem;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 3%);
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const HeaderRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const ShopIconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #e6f7ff;
  border-radius: 10px;
`;

export const ShopIcon = styled(FontAwesomeIcon)`
  font-size: 18px;
  color: #1890ff;
`;

export const BusinessName = styled(Text)`
  display: block;
  font-size: 16px;
`;

export const BusinessAddress = styled(Text)`
  font-size: 12px;
`;

export const UsersSection = styled.div`
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
`;

export const UsersTitle = styled(Text)`
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
`;

export const UserRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #fafafa;
`;

export const UserIconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f0f0f0;
  border-radius: 50%;
`;

export const UserIcon = styled(FontAwesomeIcon)`
  font-size: 12px;
  color: #999;
`;

export const UserInfo = styled.div`
  flex: 1;
`;

export const UserName = styled(Text)`
  display: block;
  font-size: 13px;
`;

export const UserEmail = styled(Text)`
  font-size: 11px;
`;

export const Tag = styled.span`
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #1890ff;
  background: #e6f7ff;
  border-radius: 10px;
`;

export const UserRoleTag = styled(Tag)`
  font-size: 10px;
`;

export const SuccessBox = styled.div`
  padding: 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
`;

export const SuccessText = styled(Text)`
  display: block;
  font-size: 11px;
  color: #52c41a;
`;

export const SuccessIcon = styled(FontAwesomeIcon)`
  margin-right: 6px;
`;

export const CreatedBusinessId = styled(Text)`
  font-size: 11px;
`;
