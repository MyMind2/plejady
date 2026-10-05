import { describe, expect, it } from "vitest";
import { compareRoomNumbers } from "./rooms";

describe("classroom number ordering", () => {
  it("sorts classroom numbers numerically", () => {
    expect(
      ["208", "102", "108", "206", "105"].sort(compareRoomNumbers),
    ).toEqual(["102", "105", "108", "206", "208"]);
    expect(["10", "9"].sort(compareRoomNumbers)).toEqual(["9", "10"]);
  });
});
