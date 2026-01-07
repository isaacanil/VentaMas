// @ts-nocheck
export async function measure(label, fn) {
  const start =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  // Run the provided function (can be sync or async)
  const result = await fn();

  const end =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  // Log using high-resolution time if available
  const duration = (end - start).toFixed(2);

  console.log(`⏱️  ${label} → ${duration} ms`);
  return result;
}
