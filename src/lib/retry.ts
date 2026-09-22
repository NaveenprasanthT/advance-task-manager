export interface RetryOptions {
  /** Total attempts including the first, not additional retries. */
  attempts?: number;
  /** Base delay in ms; doubles after each failed attempt. */
  delayMs?: number;
  onAttempt?: (attempt: number) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, delayMs = 500, onAttempt } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    onAttempt?.(attempt);
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}
