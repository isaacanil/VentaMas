import AuthorizationFlowSettingsSection from './components/AuthorizationFlowSettingsSection';
import {
  Description,
  Head,
  Heading,
  Page,
} from './AuthorizationFlowConfig.styles';

const AuthorizationFlowConfig = () => {
  return (
    <Page>
      <Head>
        <Heading>Flujo de Autorizaciones</Heading>
        <Description>
          Define como se gestionan las aprobaciones con PIN en todo el sistema.
        </Description>
      </Head>

      <AuthorizationFlowSettingsSection />
    </Page>
  );
};

export default AuthorizationFlowConfig;
