import { getAiAgentAppCheckMode } from '../config/aiCallableOptions.js';
import {
  businessCreatorModelName,
  businessCreatorThinkingLevel,
  businessCreatorThoughtSummariesEnabled,
  businessCreatorVertexLocation,
} from '../config/genkit.js';
import { buildAiBusinessSeedingStatus } from '../utils/aiBusinessSeedingStatus.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

export const handleAiBusinessSeedingAgentStatus = async (request) => {
  await assertAiBusinessSeedingDeveloperAccess(request);

  return buildAiBusinessSeedingStatus({
    appCheckMode: getAiAgentAppCheckMode(),
    appCheckTokenPresent: Boolean(request.app),
    authPresent: Boolean(request.auth),
    location: businessCreatorVertexLocation,
    model: businessCreatorModelName,
    thinkingLevel: businessCreatorThinkingLevel,
    thoughtSummariesEnabled: businessCreatorThoughtSummariesEnabled,
  });
};
