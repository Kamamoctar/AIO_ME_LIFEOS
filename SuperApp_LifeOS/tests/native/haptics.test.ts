import { describe, expect, it } from "vitest";
import { getTasbihFeedback } from "@/lib/native/haptics";

describe("tasbih haptic feedback", () => {
  it("uses a light tap between milestones", () => {
    expect(getTasbihFeedback(10, 1, null)).toBe("tap");
  });

  it("detects an exact 33-count milestone", () => {
    expect(getTasbihFeedback(32, 1, null)).toBe("milestone");
  });

  it("detects a crossed milestone when using a bulk increment", () => {
    expect(getTasbihFeedback(30, 10, null)).toBe("milestone");
  });

  it("gives the target priority over a 33-count milestone", () => {
    expect(getTasbihFeedback(32, 1, 33)).toBe("target");
  });

  it("detects a target crossed by a bulk increment", () => {
    expect(getTasbihFeedback(95, 10, 100)).toBe("target");
  });
});
