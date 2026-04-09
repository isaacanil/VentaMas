import { chatAction } from './modules/chat';
import { createBusinessAction } from './modules/createBusiness';
import type { ActionDefinition } from './types';

export const ACTIONS: Record<string, ActionDefinition> = {
  [createBusinessAction.id]: createBusinessAction,
  [chatAction.id]: chatAction,
};
