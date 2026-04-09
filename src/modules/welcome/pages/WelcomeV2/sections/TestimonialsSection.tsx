import { m, type Variants } from 'framer-motion';
import styled from 'styled-components';

const testimonials = [
  {
    id: 1,
    name: 'María González',
    business: 'Farmacia Central',
    role: 'Propietaria',
    quote:
      'Ventamax transformó completamente mi negocio. Antes perdía horas cuadrando caja y buscando productos. Ahora todo es automático y tengo control total del inventario.',
    rating: 5,
    avatar: 'MG',
    color: '#8b5cf6',
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    business: 'Supermercado El Ahorro',
    role: 'Gerente General',
    quote:
      'La mejor inversión que he hecho para mi empresa. El módulo de cuentas por cobrar me ayuda a recuperar dinero que antes se perdía. Increíble.',
    rating: 5,
    avatar: 'CR',
    color: '#06f',
  },
  {
    id: 3,
    name: 'Ana Martínez',
    business: 'Minimarket Don Pepe',
    role: 'Administradora',
    quote:
      'Mis cajeros aprendieron a usar el sistema en un día. Es súper intuitivo. Lo que más me gusta es que puedo ver las ventas en tiempo real desde mi celular.',
    rating: 5,
    avatar: 'AM',
    color: '#10b981',
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const TestimonialsSection = () => (
  <Section>
    <Header
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <SectionLabel>Testimonios</SectionLabel>
      <SectionTitle>
        Lo que dicen nuestros <Accent>clientes</Accent>
      </SectionTitle>
    </Header>

    <Grid
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {testimonials.map((t) => (
        <Card key={t.id} variants={card}>
          <Stars>
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i}>★</Star>
            ))}
          </Stars>
          <Quote>&ldquo;{t.quote}&rdquo;</Quote>
          <Author>
            <Avatar $color={t.color}>{t.avatar}</Avatar>
            <AuthorInfo>
              <AuthorName>{t.name}</AuthorName>
              <AuthorRole>
                {t.role} — {t.business}
              </AuthorRole>
            </AuthorInfo>
          </Author>
        </Card>
      ))}
    </Grid>
  </Section>
);

export default TestimonialsSection;

/* ── Styles ── */
const Section = styled.section`
  padding: 100px 24px;
  background: linear-gradient(180deg, #f0f2ff 0%, #fafbff 100%);

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 48px;
`;

const SectionLabel = styled.span`
  display: inline-block;
  padding: 4px 14px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary, #06f);
  background: rgba(0, 102, 255, 0.07);
  border-radius: 100px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-100, #2b3043);
`;

const Accent = styled.span`
  background: linear-gradient(135deg, var(--primary, #06f), #7c3aed);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Grid = styled(m.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
`;

const Card = styled(m.div)`
  padding: 32px 28px;
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
`;

const Star = styled.span`
  font-size: 18px;
  color: #f59e0b;
`;

const Quote = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-60, #5c667b);
  font-style: italic;
  flex: 1;
`;

const Author = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: ${({ $color }) => $color};
  border-radius: 12px;
  flex-shrink: 0;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

const AuthorRole = styled.div`
  font-size: 13px;
  color: var(--text-60, #5c667b);
`;
