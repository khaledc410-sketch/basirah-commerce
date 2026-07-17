import { DelayedError } from "bullmq";
import { describe, expect, it, vi } from "vitest";

import { delayVisibilityJobUntilLeaseAvailable } from "./visibility-queue";

describe("visibility queue lease coordination", () => {
  it("moves a redelivery past the DB lease without consuming a failed attempt", async () => {
    const moveToDelayed = vi.fn(async () => undefined);

    await expect(
      delayVisibilityJobUntilLeaseAvailable(
        { moveToDelayed },
        "worker-lock-token",
        20_000,
        10_000,
      ),
    ).rejects.toBeInstanceOf(DelayedError);

    expect(moveToDelayed).toHaveBeenCalledWith(20_250, "worker-lock-token");
  });
});
