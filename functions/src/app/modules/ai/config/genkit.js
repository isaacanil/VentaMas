import { vertexAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

const readEnvString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const projectId =
  readEnvString(process.env.GCLOUD_PROJECT) ||
  readEnvString(process.env.FIREBASE_PROJECT_ID) ||
  readEnvString(process.env.PROJECT_ID);

const vertexModelName =
  readEnvString(process.env.GENKIT_VERTEX_MODEL) || 'gemini-3-flash-preview';

const configuredVertexLocation =
  readEnvString(process.env.GENKIT_VERTEX_LOCATION) ||
  readEnvString(process.env.VERTEX_AI_LOCATION);

// Gemini 3 preview models are served from the global endpoint in Vertex AI.
const vertexLocation =
  configuredVertexLocation ||
  (vertexModelName.startsWith('gemini-3-') ? 'global' : 'us-central1');

const vertexPluginOptions = projectId
  ? { projectId, location: vertexLocation }
  : { location: vertexLocation };

export const ai = genkit({
  plugins: [vertexAI(vertexPluginOptions)],
});

export const businessCreatorModel = vertexAI.model(vertexModelName);
