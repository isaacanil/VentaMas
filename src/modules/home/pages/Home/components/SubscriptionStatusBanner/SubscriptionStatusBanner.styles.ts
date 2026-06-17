import styled from 'styled-components';

export const Banner = styled.section<{ $tone: 'info' | 'warning' | 'danger' }>`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.1rem;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'linear-gradient(135deg, #fff1f2, #ffe4e6)'
      : $tone === 'warning'
        ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
        : 'linear-gradient(135deg, #ecfeff, #cffafe)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgb(244 63 94 / 24%)'
        : $tone === 'warning'
          ? 'rgb(245 158 11 / 26%)'
          : 'rgb(6 182 212 / 22%)'};
  border-radius: 18px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 5%);
`;

export const Content = styled.div`
  display: flex;
  flex: 1 1 460px;
  gap: 0.9rem;
  align-items: flex-start;
  min-width: 0;
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  height: 34px;
  padding: 0 0.85rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgb(255 255 255 / 72%);
  border-radius: 999px;
`;

export const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
`;

export const Description = styled.p`
  margin: 0;
  color: #334155;
  line-height: 1.45;
`;

export const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 0.75rem;
  align-items: center;
`;

export const PrimaryAction = styled.button`
  min-height: 44px;
  padding: 0.8rem 1rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: #0f766e;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgb(15 118 110 / 24%);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgb(15 118 110 / 28%);
  }
`;
