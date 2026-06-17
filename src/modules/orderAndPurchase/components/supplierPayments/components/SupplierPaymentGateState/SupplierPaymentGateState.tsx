import { Spin } from 'antd';
import styled from 'styled-components';

interface SupplierPaymentGateStateProps {
  title: string;
  description: string;
  loading?: boolean;
}

export const SupplierPaymentGateState = ({
  title,
  description,
  loading = false,
}: SupplierPaymentGateStateProps) => {
  return (
    <Container aria-live="polite" role="status">
      {loading ? <StyledSpin size="large" /> : <Indicator />}
      <Content>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 18px;
  min-height: 368px;
  padding: 36px 28px;
  text-align: center;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
`;

const StyledSpin = styled(Spin)`
  .ant-spin-dot-item {
    background-color: #2f2f2f;
  }
`;

const Indicator = styled.span`
  display: inline-flex;
  width: 34px;
  height: 2px;
  background: #d4d4d4;
  border-radius: 999px;
`;

const Content = styled.div`
  display: grid;
  gap: 10px;
  max-width: 320px;
`;

const Title = styled.h2`
  margin: 0;
  color: #262626;
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.2;
`;

const Description = styled.p`
  margin: 0;
  color: #595959;
  font-size: 1rem;
  line-height: 1.6;
`;
