import { HeartFilled } from '@/constants/icons/antd';
import { m } from 'framer-motion';
import styled from 'styled-components';

const FooterV2 = () => (
  <Footer
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <Inner>
      <Top>
        <Brand>
          <BrandIcon>V</BrandIcon>
          <div>
            <BrandName>Ventamax</BrandName>
            <BrandTag>Punto de venta inteligente</BrandTag>
          </div>
        </Brand>

        <LinksGroup>
          <LinksTitle>Producto</LinksTitle>
          <FooterLink href="#features">Funcionalidades</FooterLink>
          <FooterLink href="#showcase">Módulos</FooterLink>
          <FooterLink href="#workflow">Cómo funciona</FooterLink>
        </LinksGroup>

        <LinksGroup>
          <LinksTitle>Empresa</LinksTitle>
          <FooterLink href="mailto:soporte@ventamax.com">Soporte</FooterLink>
          <FooterLink href="mailto:soporte@ventamax.com">Contacto</FooterLink>
        </LinksGroup>

        <LinksGroup>
          <LinksTitle>Legal</LinksTitle>
          <FooterLink href="#">Términos de uso</FooterLink>
          <FooterLink href="#">Privacidad</FooterLink>
        </LinksGroup>
      </Top>

      <Divider />

      <Bottom>
        <Copyright>
          © {new Date().getFullYear()} Ventamax — Todos los derechos reservados
        </Copyright>
        <MadeWith>
          Desarrollado con{' '}
          <HeartFilled
            style={{ color: '#ff4d4f', margin: '0 4px', fontSize: 14 }}
          />{' '}
          por <strong>Gisys</strong>
        </MadeWith>
      </Bottom>
    </Inner>
  </Footer>
);

export default FooterV2;

/* ── Styles ── */
const Footer = styled(m.footer)`
  padding: 60px 24px 24px;
  background: #fafbff;
  border-top: 1px solid #eef0f5;
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Top = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const BrandIcon = styled.div`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--primary, #06f), #4f46e5);
  border-radius: 12px;
  flex-shrink: 0;
`;

const BrandName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

const BrandTag = styled.div`
  font-size: 13px;
  color: var(--text-60, #5c667b);
`;

const LinksGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LinksTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-100, #2b3043);
  margin-bottom: 4px;
`;

const FooterLink = styled.a`
  font-size: 14px;
  color: var(--text-60, #5c667b);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: var(--primary, #06f);
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eef0f5;
  margin: 0 0 24px;
`;

const Bottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const Copyright = styled.span`
  font-size: 13px;
  color: #999;
`;

const MadeWith = styled.span`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #999;
`;
