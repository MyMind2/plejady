import { describe, expect, it } from "vitest";
import { studentClasses, studentClassSchema } from "./student-classes";

describe("student class validation", () => {
  it("accepts all twelve configured classes", () => {
    expect(studentClasses).toHaveLength(12);
    for (const className of studentClasses)
      expect(studentClassSchema.parse(className)).toBe(className);
  });

  it("rejects values outside the fixed class list", () => {
    expect(studentClassSchema.safeParse("Páťák").success).toBe(false);
    expect(studentClassSchema.safeParse("").success).toBe(false);
  });
});
