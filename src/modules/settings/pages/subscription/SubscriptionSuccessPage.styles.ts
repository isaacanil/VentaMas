import { Alert } from 'antd';
import styled from 'styled-components';

export const PageWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 60px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 50%, #fffbeb 100%);

  &::before {
    position: fixed;
    top: -50%;
    left: -50%;
    z-index: 0;
    width: 200%;
    height: 200%;
    pointer-events: none;
    content: '';
    background:
      radial-gradient(
        circle at 30% 30%,
        rgb(16 185 129 / 5%) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 70% 70%,
        rgb(14 165 233 / 5%) 0%,
        transparent 40%
      );
  }
`;

export const GlassCard = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 520px;
  padding: 56px 40px;
  border: 1px solid rgb(255 255 255 / 50%);
  border-radius: 40px;
  background: rgb(255 255 255 / 75%);
  box-shadow:
    0 20px 50px -12px rgb(0 0 0 / 8%),
    0 0 0 1px rgb(0 0 0 / 2%);
  text-align: center;
  backdrop-filter: blur(24px);
`;

export const StatusIconContainer = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  border-radius: 24px;
  background: ${(props) => `${props.$color}15`};
  box-shadow: inset 0 0 0 1px ${(props) => `${props.$color}25`};
  color: ${(props) => props.$color};
  font-size: 32px;
`;

export const HeaderSection = styled.div`
  margin-bottom: 32px;
`;

export const StyledAlert = styled(Alert)`
  width: 100%;
  margin-bottom: 24px;
  border: 1px solid rgb(255 255 255 / 80%) !important;
  border-radius: 16px;
  background: rgb(255 255 255 / 50%) !important;
  text-align: left;
`;

export const BenefitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 40px;
`;

export const BenefitItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 14px 20px;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 18px;
  background: rgb(255 255 255 / 40%);
  text-align: left;
  transition:
    transform 0.2s ease,
    background 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgb(255 255 255 / 60%);
  }

  .icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 12px rgb(0 0 0 / 3%);
    color: #0d9488;
    font-size: 18px;
  }

  .text-box {
    display: flex;
    flex-direction: column;

    .label {
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }

    .value {
      color: #1e293b;
      font-size: 15px;
      font-weight: 600;
    }
  }
`;

export const ActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;
