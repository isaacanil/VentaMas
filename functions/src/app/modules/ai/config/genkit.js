import { vertexAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

const readEnvString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const readBooleanEnv = (value) => {
  const normalized = readEnvString(value)?.toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const projectId =
  readEnvString(process.env.GCLOUD_PROJECT) ||
  readEnvString(process.env.FIREBASE_PROJECT_ID) ||
  readEnvString(process.env.PROJECT_ID);

const DEFAULT_VERTEX_MODEL = 'gemini-3-flash-preview';

const vertexModelName =
  readEnvString(process.env.GENKIT_VERTEX_MODEL) || DEFAULT_VERTEX_MODEL;

const configuredVertexLocation =
  readEnvString(process.env.GENKIT_VERTEX_LOCATION) ||
  readEnvString(process.env.VERTEX_AI_LOCATION);

// Gemini 3/3.1 preview models are served from the global endpoint in Vertex AI.
const vertexLocation =
  configuredVertexLocation ||
  (vertexModelName.startsWith('gemini-3') ? 'global' : 'us-central1');

const GEMINI_3_THINKING_LEVELS = new Set([
  'MINIMAL',
  'LOW',
  'MEDIUM',
  'HIGH',
]);

const readGemini3ThinkingLevel = (value) => {
  const normalized = readEnvString(value)?.toUpperCase();
  return GEMINI_3_THINKING_LEVELS.has(normalized) ? normalized : null;
};

const configuredThinkingLevel = readGemini3ThinkingLevel(
  process.env.GENKIT_THINKING_LEVEL,
);

const includeThoughtSummaries = readBooleanEnv(
  process.env.GENKIT_INCLUDE_THOUGHT_SUMMARIES,
);

const isGemini3Model = vertexModelName.startsWith('gemini-3');

export const businessCreatorThinkingLevel = isGemini3Model
  ? configuredThinkingLevel
  : null;

export const businessCreatorThoughtSummariesEnabled =
  isGemini3Model && includeThoughtSummaries;

export const businessCreatorThinkingConfig = businessCreatorThinkingLevel
  ? {
      thinkingLevel: businessCreatorThinkingLevel,
      ...(businessCreatorThoughtSummariesEnabled
        ? { includeThoughts: true }
        : {}),
    }
  : null;

const vertexPluginOptions = projectId
  ? { projectId, location: vertexLocation }
  : { location: vertexLocation };

export const ai = genkit({
  plugins: [vertexAI(vertexPluginOptions)],
});

export const businessCreatorModelName = vertexModelName;
export const businessCreatorVertexLocation = vertexLocation;
export const businessCreatorModel = vertexAI.model(vertexModelName);
