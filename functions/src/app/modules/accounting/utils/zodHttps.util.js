import { HttpsError } from 'firebase-functions/v2/https';

const buildIssueLabel = (issue) => {
  if (!issue) return null;
  const path = Array.isArray(issue.path) && issue.path.length
    ? `${issue.path.join('.')}: `
    : '';
  return `${path}${issue.message}`;
};

export const parseSchemaOrThrow = (
  schema,
  value,
  fallbackMessage = 'Los datos enviados no son válidos.',
) => {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  const firstIssue = buildIssueLabel(result.error.issues[0]);
  throw new HttpsError(
    'invalid-argument',
    firstIssue || fallbackMessage,
    {
      issues: result.error.issues.map((issue) => ({
        path: Array.isArray(issue.path) ? issue.path.join('.') : '',
        message: issue.message,
      })),
    },
  );
};
