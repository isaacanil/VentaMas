import { m } from 'framer-motion';
import styled from 'styled-components';

export const Section = styled.section`
  padding: 100px 24px;
  background: #fff;

  @media (width <= 768px) {
    padding: 60px 16px;
  }
`;

export const Inner = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

export const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 64px;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 16px;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-100, #2b3043);
`;

export const Accent = styled.span`
  background: linear-gradient(135deg, var(--primary, #06f), #7c3aed);
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const SectionSub = styled.p`
  max-width: 460px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
`;

export const Steps = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const Step = styled(m.div)`
  display: flex;
  gap: 24px;
`;

export const StepLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

export const StepNumber = styled.div`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--primary, #06f), #4f46e5);
  border-radius: 14px;
  flex-shrink: 0;
`;

export const Connector = styled.div`
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(
    180deg,
    var(--primary, #06f) 0%,
    rgb(0 102 255 / 10%) 100%
  );
  border-radius: 2px;
`;

export const StepContent = styled.div`
  padding-bottom: 48px;
`;

export const StepIcon = styled.div`
  font-size: 28px;
  margin-bottom: 8px;
`;

export const StepTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

export const StepDesc = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
  max-width: 480px;
`;
