const NON_BLOCKING_FAILED_TASK_TYPES = new Set(['attachToCashCount']);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export function summarizeOutboxTasks(taskDocs = []) {
  return taskDocs
    .map((taskDoc) => {
      const data = typeof taskDoc?.data === 'function' ? taskDoc.data() : taskDoc;
      const type = toCleanString(data?.type);
      if (!type) return null;
      return {
        id: taskDoc?.id || data?.id || null,
        type,
        status: toCleanString(data?.status) || null,
        lastError: toCleanString(data?.lastError) || null,
      };
    })
    .filter(Boolean);
}

export function areOnlyNonBlockingFailures(tasks = []) {
  const normalizedTasks = summarizeOutboxTasks(tasks);
  return (
    normalizedTasks.length > 0 &&
    normalizedTasks.every((task) => NON_BLOCKING_FAILED_TASK_TYPES.has(task.type))
  );
}

export function buildNonBlockingFailureSummary(tasks = []) {
  const normalizedTasks = summarizeOutboxTasks(tasks);
  const taskTypes = Array.from(new Set(normalizedTasks.map((task) => task.type)));

  return {
    taskTypes,
    taskErrors: normalizedTasks.map((task) => ({
      type: task.type,
      lastError: task.lastError,
    })),
    requiresCashCountReview: taskTypes.includes('attachToCashCount'),
  };
}
