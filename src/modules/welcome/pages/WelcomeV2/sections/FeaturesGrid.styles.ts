import { m } from 'framer-motion';
import styled from 'styled-components';

export const Section = styled.section`
  padding: 100px 24px;
  max-width: 1200px;
  margin: 0 auto;

  @media (width <= 768px) {
    padding: 60px 16px;
  }
`;

export const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 60px;
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
  max-width: 560px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
`;

export const Grid = styled(m.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled(m.div)`
  padding: 28px 24px;
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 12px 32px rgb(0 0 0 / 8%);
  }
`;

export const CardIcon = styled.div<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  font-size: 22px;
  background: ${({ $color }) => `${$color}10`};
  border: 1.5px solid ${({ $color }) => `${$color}25`};
  border-radius: 12px;
`;

export const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

export const Tag = styled.span<{ $color: string }>`
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}12`};
  border-radius: 6px;
`;

export const CardDesc = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
`;
