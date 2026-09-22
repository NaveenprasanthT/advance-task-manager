export interface RetryOptions {
  /** Total attempts including the first, not additional retries. */
  attempts?: number;
  /** Base delay in ms; doubles after each failed attempt. */
  delayMs?: number;
  onAttempt?: (attempt: number) => void;
  /** Overrides the wait before the next attempt (e.g. a server-provided retry-after hint). */
  getDelayMs?: (err: unknown, attempt: number, defaultDelayMs: number) => number;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, delayMs = 500, onAttempt, getDelayMs } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    onAttempt?.(attempt);
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts) throw err;
      const defaultDelayMs = delayMs * 2 ** (attempt - 1);
      const wait = getDelayMs?.(err, attempt, defaultDelayMs) ?? defaultDelayMs;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw lastError;
}
