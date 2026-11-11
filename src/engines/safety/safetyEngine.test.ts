import { describe, it, mock, before, after } from "node:test";
import safetyEngine from "./safetyEngine.ts";
import assert from "node:assert";

const safetyPath = "src/data/test/safety";
describe("Safety engine", () => {
  // Silent all console log/warn/info
  before(() => {
    for (const method of ["log", "info", "warn"] as const) {
      mock.method(console, method, () => {});
    }
  });

  after(() => mock.restoreAll());

  // Expected behavior
  it("Should return a valid data", async () => {
    const result = await safetyEngine(`src/data/safety/accelerometer_data.csv`);
    assert.deepEqual(result, {
      date: "2023-03-15",
      count: 1,
      unit: "m/s²",
      threshold: -2.5,
      events: [
        { timestamp: 1678880005, acc_x: 0.25, acc_y: -3.45, acc_z: 9.65 },
      ],
      score: 95,
    });
  });

  // Empty CSV
  it("should throw an error with empty CSV", async () => {
    await assert.rejects(
      async () => await safetyEngine(`${safetyPath}/empty.csv`),
      /Empty file/,
      "Assertion failed, please check the error",
    );
  });

  // File with non numéric value
  it("Should get a warning when there is a non numeric value", async (t) => {
    const warn = t.mock.method(console, "warn", () => {}); // mute console.warn
    await safetyEngine(`${safetyPath}/non_numeric.csv`);

    assert.ok(warn.mock.callCount() > 0); // at least called once
  });

  // File with incomplete field
  it("Should get a warning when there is an incomplete field", async (t) => {
    const warn = t.mock.method(console, "warn", () => {}); // mute console.warn

    await safetyEngine(`${safetyPath}/incomplete_row.csv`);

    assert.ok(warn.mock.callCount() > 0); // at least called once
  });
});
