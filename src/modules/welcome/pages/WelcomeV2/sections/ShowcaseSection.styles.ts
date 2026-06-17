import { m } from 'framer-motion';
import styled from 'styled-components';

export { SectionLabel } from './SectionPrimitives.styles';

export const Section = styled.section`
  padding: 100px 24px;
  background: linear-gradient(180deg, #fafbff 0%, #f0f2ff 100%);

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

export const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 48px;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-100, #2b3043);
`;

export const Accent = styled.span`
  background: linear-gradient(135deg, var(--primary, #06f), #7c3aed);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const Tabs = styled.div`
  display: flex;
  gap: 10px;
  max-width: 1000px;
  margin: 0 auto 48px;
  overflow-x: auto;
  padding-bottom: 4px;
  justify-content: center;
  flex-wrap: wrap;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Tab = styled(m.button)<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid ${({ $active, $color }) => ($active ? $color : '#e0e4eb')};
  border-radius: 12px;
  background: ${({ $active, $color }) => ($active ? `${$color}0d` : '#fff')};
  color: ${({ $active, $color }) =>
    $active ? $color : 'var(--text-60, #5c667b)'};
  white-space: nowrap;
  outline: none;
  transition: all 0.2s;
`;

export const TabEmoji = styled.span`
  font-size: 18px;
`;

export const TabLabel = styled.span``;

export const Content = styled(m.div)`
  display: flex;
  gap: 48px;
  max-width: 1000px;
  margin: 0 auto;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const ContentText = styled.div`
  flex: 1;
`;

export const ModuleTitle = styled.h3<{ $color: string }>`
  margin: 0 0 16px;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

export const ModuleDesc = styled.p`
  margin: 0 0 24px;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-60, #5c667b);
`;

export const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const HighlightItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-100, #2b3043);
`;

export const CheckMark = styled.span<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: ${({ $color }) => $color};
  border-radius: 6px;
  flex-shrink: 0;
`;

export const ContentVisual = styled.div<{ $color: string }>`
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid ${({ $color }) => `${$color}20`};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex: auto;
    width: 100%;
    max-width: 400px;
  }
`;

export const VisualIcon = styled.div`
  font-size: 48px;
`;

export const VisualLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

export const VisualBars = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Bar = styled(m.div)<{ $color: string }>`
  width: 100%;
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    ${({ $color }) => $color},
    ${({ $color }) => `${$color}80`}
  );
  transform-origin: left center;
`;
