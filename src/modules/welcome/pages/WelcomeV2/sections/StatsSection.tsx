import { m } from 'framer-motion';
import styled from 'styled-components';

const stats = [
  { value: '10+', label: 'Módulos integrados' },
  { value: '100%', label: 'En la nube' },
  { value: '24/7', label: 'Disponibilidad' },
  { value: '5', label: 'Roles de usuario' },
];

const StatsSection = () => (
  <Section>
    <Inner>
      {stats.map((s, i) => (
        <Stat
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <Value>{s.value}</Value>
          <Label>{s.label}</Label>
        </Stat>
      ))}
    </Inner>
  </Section>
);

export default StatsSection;

const Section = styled.section`
  position: relative;
  z-index: 2;
  margin-top: -40px;
  padding: 0 24px;

  @media (max-width: 768px) {
    margin-top: 0;
    padding: 0 16px;
  }
`;

const Inner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 24px;
    gap: 16px;
  }
`;

const Stat = styled(m.div)`
  text-align: center;
`;

const Value = styled.div`
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary, #06f), #7c3aed);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Label = styled.div`
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-60, #5c667b);
`;
