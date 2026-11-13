import { describe, it, mock, before, after } from "node:test";
import safetyEngine from "./safetyEngine.ts";
import assert from "node:assert";

const safetyPath = "src/data/test/safety";
describe("Safety engine", () => {
  // Silence all console output (log/info/warn)
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

  // CSV with only the header line
  it("Should reject a CSV with only a header", async () => {
    await assert.rejects(
      async () => await safetyEngine(`${safetyPath}/header_only.csv`),
      /Empty file/,
    );
  });

  // File with non-numeric values
  it("Should get a warning when there is a non numeric value", async (t) => {
    const warn = t.mock.method(console, "warn", () => {}); // mute console.warn
    await safetyEngine(`${safetyPath}/non_numeric.csv`);

    assert.equal(warn.mock.callCount(), 2);
  });

  // File with incomplete field
  it("Should get a warning when there is an incomplete field", async (t) => {
    const warn = t.mock.method(console, "warn", () => {}); // mute console.warn

    await safetyEngine(`${safetyPath}/incomplete_row.csv`);

    assert.equal(warn.mock.callCount(), 2);
  });

  // Valid file without any harsh braking
  it("Should return a perfect score when there is no harsh braking", async () => {
    const result = await safetyEngine(`${safetyPath}/no_braking.csv`);

    assert.deepEqual(result, {
      date: "2023-03-15",
      count: 0,
      unit: "m/s²",
      threshold: -2.5,
      events: [],
      score: 100,
    });
  });

  // More than 20 events: the score stops at 0
  it("Should never return a score below 0", async () => {
    const result = await safetyEngine(`${safetyPath}/many_braking.csv`);

    assert.equal(result.count, 22);
    assert.equal(result.score, 0);
  });
});
