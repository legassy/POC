import zfeEngine from "./zfeEngine.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import rawTruckData from "../../data/zfe/truck_gps.json" with { type: "json" };
import rawPolygonData from "../../data/zfe/lyon_polygon.json" with { type: "json" };

// Data test cases
import readJson from "../../utils/readJson.ts";
import type { GeoPoint, TruckData } from "../../types/ZfeEngineType.ts";

describe("ZFE Engine", () => {
  // test case with normal data
  it("should correctly identify points inside the bounding box and inside the polygon", () => {
    const result = zfeEngine(rawTruckData, rawPolygonData);

    const insideIds = result.inside.map((point) => point.id);
    const outsideIds = result.outside.map((point) => point.id);

    assert(
      result.inside.length === 2,
      `Expected 2 points inside, got ${result.inside.length}`,
    );

    // Point 3 is in the bounding box, but the ray casting puts it outside:
    // at lat 45.785 the north edge is at lon 4.83, the point is at lon 4.805
    assert.deepEqual(outsideIds, [3], "Point with id 3 should be outside");
    assert(insideIds.includes(4), "Point with id 4 should be inside");
    assert(insideIds.includes(5), "Point with id 5 should be inside");
  });

  // Compare the engine result with the expected value of each point
  // Point 3 is the only known mismatch (see README, le cas du point 3)
  it("should match the expected value of each point, except point 3", () => {
    const result = zfeEngine(rawTruckData, rawPolygonData);
    const insideIds = new Set(result.inside.map((point) => point.id));

    const mismatches = (rawTruckData as TruckData[])
      .filter((point) => point.expected)
      .filter(
        (point) => point.expected!.startsWith("IN") !== insideIds.has(point.id),
      )
      .map((point) => point.id);

    assert.deepEqual(mismatches, [3], "Only point 3 should differ from expected");
  });

  // test case with empty data
  it("should throw an error when no data is provided", () => {
    assert.throws(
      () => zfeEngine(),
      Error,
      "Expected an error to be thrown when no data is provided",
    );
  });

  // test case with data that are not arrays
  it("should throw an error when data are not arrays", () => {
    assert.throws(
      () =>
        zfeEngine({} as unknown as TruckData[], {} as unknown as GeoPoint[]),
      /Expected arrays/,
    );
  });

  // test case with a null truck point: skipped with a warning, the run continues
  it("should skip a null truck point without crashing", (t) => {
    const warn = t.mock.method(console, "warn", () => {});
    const truckData = [null, ...rawTruckData] as unknown as TruckData[];

    const result = zfeEngine(truckData, rawPolygonData);

    assert.equal(warn.mock.callCount(), 1);
    assert.deepEqual(
      result.inside.map((p) => p.id),
      [4, 5],
    );
  });

  // test case with invalid json data
  it("should return null when JSON data is invalid", () => {
    const result = readJson("src/data/test/zfe/polygon_invalid.json");
    assert.equal(result, null);
  });

  // test case with invalid truck data
  it("should get only valid points when truck data is invalid", () => {
    const truckData = readJson(
      "src/data/test/zfe/truck_invalid_values.json",
    ) as unknown as TruckData[];
    const result = zfeEngine(truckData, rawPolygonData);
    assert.equal(result.inside.length, 1, "Expected 1 point inside");
    assert.deepEqual(
      result.inside.map((p) => p.id),
      [1],
    );
  });

  // test polygon with invalid values
  it("should throw an error when polygon has invalid values", () => {
    const invalidPolygon = [
      { lat: 45.75, lon: 4.85 },
      { lat: 45.76, lon: 4.86 },
      { lat: 45.77, lon: "invalid" }, // lon must be a number
    ] as unknown as GeoPoint[];
    assert.throws(
      () => zfeEngine(rawTruckData, invalidPolygon),
      /Invalid polygon data format/,
      "Expected an error to be thrown when polygon has invalid values",
    );
  });
  // test case polygon with less than 3 points
  it("should throw an error when polygon has less than 3 points", () => {
    const invalidPolygon = readJson(
      "src/data/test/zfe/polygon_too_few_points.json",
    ) as unknown as GeoPoint[];
    assert.throws(
      () => zfeEngine(rawTruckData, invalidPolygon),
      /3 points/,
      "Expected an error to be thrown when polygon has less than 3 points",
    );
  });
});
