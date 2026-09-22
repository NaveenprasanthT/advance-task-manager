// Proactively spaces out Gemini calls so we stay under the free-tier RPM
// ceiling instead of reactively hitting 429s. Shared by auto-generate and
// puzzle-game since both draw from the same account-level quota.
// In-memory only: sufficient for a single server process; on a
// multi-instance deployment each instance would track its own budget.
class SlidingWindowRateLimiter {
  private timestamps: number[] = [];

  constructor(
    private readonly maxPerWindow: number,
    private readonly windowMs: number,
  ) {}

  async acquire(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
      if (this.timestamps.length < this.maxPerWindow) {
        this.timestamps.push(now);
        return;
      }
      const waitMs = this.windowMs - (now - this.timestamps[0]) + 50;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

const maxRpm = Number(process.env.GEMINI_MAX_RPM) || 10;

export const geminiLimiter = new SlidingWindowRateLimiter(maxRpm, 60_000);
