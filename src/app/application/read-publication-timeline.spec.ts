import { describe, expect, it, vi } from "vitest";
import { testTimeline } from "../../../tests/related-fixtures";
import { ReadPublicationTimeline } from "./read-publication-timeline";
describe("ReadPublicationTimeline", () => {
  it("delegates process and page to its own port with cancellation", async () => {
    const timeline = vi.fn().mockResolvedValue(testTimeline("source"));
    const signal = new AbortController().signal;
    const query = { cnj: null, page: 0, pageSize: 20 as const };
    await new ReadPublicationTimeline({ timeline }).execute(
      "source",
      query,
      signal,
    );
    expect(timeline).toHaveBeenCalledWith("source", query, signal);
  });
  it("rejects invalid identities, page bounds and process formats before transport", () => {
    const timeline = vi.fn();
    const useCase = new ReadPublicationTimeline({ timeline });
    const base = { cnj: null, page: 0, pageSize: 20 as const };
    const signal = new AbortController().signal;
    expect(() => useCase.execute(" ", base, signal)).toThrow();
    for (const query of [
      { ...base, page: -1 },
      { ...base, page: 500 },
      { ...base, cnj: "bad" },
    ])
      expect(() => useCase.execute("source", query, signal)).toThrow();
    expect(timeline).not.toHaveBeenCalled();
  });
});
