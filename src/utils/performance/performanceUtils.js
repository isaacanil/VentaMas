/**
 * Performance utility functions to help avoid main thread blocking
 */

/**
 * A performance-optimized setTimeout that uses requestIdleCallback when available
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds (capped at 500ms to avoid violations)
 * @returns {number} Timer ID for cleanup
 */
export const performantTimeout = (callback, delay = 0) => {
  // Cap delay at 500ms to prevent violation warnings
  const cappedDelay = Math.min(delay, 500);

  if (window.requestIdleCallback && cappedDelay > 16) {
    // For longer delays, use requestIdleCallback to defer work
    return window.requestIdleCallback(() => {
      setTimeout(callback, cappedDelay);
    });
  } else {
    // For short delays or browsers without requestIdleCallback
    return setTimeout(callback, cappedDelay);
  }
};

/**
 * Debounced function that uses performantTimeout internally
 * @param {Function} func - Function to debounce
 * @param {number} delay - Debounce delay
 * @returns {Function} Debounced function
 */
export const performantDebounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = performantTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Throttled function that prevents excessive calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const performantThrottle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      performantTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Batch DOM reads and writes to prevent forced reflows
 * @param {Function} readCallback - Function that reads from DOM
 * @param {Function} writeCallback - Function that writes to DOM
 */
export const batchDOMOperations = (readCallback, writeCallback) => {
  requestAnimationFrame(() => {
    // Batch all DOM reads first
    const readResults = readCallback();

    // Then batch all DOM writes
    requestAnimationFrame(() => {
      writeCallback(readResults);
    });
  });
};

/**
 * Schedule work with requestIdleCallback or fallback to setTimeout
 * @param {Function} work - Work to be done
 * @param {Object} options - Options for requestIdleCallback
 */
export const scheduleWork = (work, options = {}) => {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(work, {
      timeout: 5000, // Ensure work gets done within 5 seconds
      ...options,
    });
  } else {
    return performantTimeout(work, 0);
  }
};
