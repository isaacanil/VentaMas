import { ErrorElement } from '@/modules/app/pages/ErrorElement/ErrorElement';

const SAMPLE_ERROR_STACK = [
  'Error: Vista de prueba del ErrorElement',
  '    at ErrorScreenPreview (/src/modules/dev/pages/DevTools/ErrorScreenPreview/ErrorScreenPreview.tsx:1:1)',
  '    at RenderedRoute (/node_modules/react-router/dist/index.js:000:00)',
  '    at ErrorBoundary (/src/modules/app/pages/ErrorElement/ErrorBoundary.tsx:1:1)',
].join('\n');

const SAMPLE_COMPONENT_STACK = [
  '    at ErrorScreenPreview',
  '    at DeveloperToolRoute',
  '    at ErrorBoundary',
].join('\n');

const ErrorScreenPreview = () => {
  return (
    <ErrorElement
      autoReport={false}
      errorInfo={SAMPLE_COMPONENT_STACK}
      errorStackTrace={SAMPLE_ERROR_STACK}
    />
  );
};

export default ErrorScreenPreview;
