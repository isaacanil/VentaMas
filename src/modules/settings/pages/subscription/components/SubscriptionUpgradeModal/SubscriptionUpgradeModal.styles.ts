import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export const ModalBody = styled.div`
  display: grid;
  gap: 18px;
`;

export const HeroCard = styled.section`
  position: relative;
  display: grid;
  gap: 12px;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgb(251 191 36 / 24%), transparent 36%),
    linear-gradient(145deg, #fff8e7 0%, #f8fafc 46%, #eff6ff 100%);
  border: 1px solid rgb(14 116 144 / 12%);
  border-radius: 24px;

  .ant-typography {
    position: relative;
    margin-bottom: 0;
  }
`;

export const HeroGlow = styled.div`
  position: absolute;
  inset: auto -52px -74px auto;
  width: 180px;
  height: 180px;
  background: rgb(14 165 233 / 12%);
  border-radius: 999px;
  filter: blur(8px);
`;

export const HeroHeader = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const LockBadge = styled.div`
  display: grid;
  width: 44px;
  height: 44px;
  color: #075985;
  place-items: center;
  background: rgb(255 255 255 / 82%);
  border-radius: 14px;
  box-shadow: 0 12px 34px rgb(14 116 144 / 10%);
`;

export const ReasonPill = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #7c2d12;
  background: rgb(255 237 213 / 88%);
  border-radius: 999px;
`;

export const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const BenefitCard = styled.div`
  display: grid;
  gap: 10px;
  min-height: 132px;
  padding: 18px;
  background: #fff;
  border: 1px solid rgb(148 163 184 / 22%);
  border-radius: 20px;
  box-shadow: 0 14px 40px rgb(15 23 42 / 6%);
`;

export const BenefitIcon = styled(FontAwesomeIcon)`
  font-size: 18px;
  color: #0f766e;
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
`;
