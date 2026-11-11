import type {
  GeoPoint,
  PointsInsidePolygon,
  TruckData,
} from "../../types/ZfeEngineType.ts";

/**
 * ZFE Engine that checks which truck data points are inside a given polygon.
 * @param truckData Array of truck data points to be checked.
 * @param polygon Array of GeoPoints that define the polygon.
 * @returns   Points inside the polygon, and points inside the bounding box but outside the polygon.
 */
const zfeEngine = (
  truckData?: TruckData[],
  polygon?: GeoPoint[],
): PointsInsidePolygon => {
  // Guard to ensure the data is provided
  if (!truckData || !polygon) {
    throw new Error("Polygon data and truck data must be provided.");
  }

  // Guard to ensure json data is valid
  if (!Array.isArray(truckData) || !Array.isArray(polygon)) {
    throw new Error(
      "Invalid data format. Expected arrays for truck data and polygon.",
    );
  }

  // Guard to ensure polygon has at least 3 points
  if (polygon.length < 3) {
    throw new Error("Polygon must have at least 3 points.");
  }

  // Cast the raw data to the correct types
  const polygonData: GeoPoint[] = polygon as GeoPoint[];

  if (
    polygonData.some(
      (point) => typeof point.lat !== "number" || typeof point.lon !== "number",
    )
  ) {
    throw new Error(
      "Invalid polygon data format. Expected numbers for lat and lon.",
    );
  }

  // Filter out invalid truck data points
  const validTruckData = truckData.filter((point) => {
    // A null or non-object entry must be skipped, not crash the whole run
    if (typeof point !== "object" || point === null) {
      console.warn(
        `[WARN] Invalid truck data format: expected an object, got ${JSON.stringify(point)}`,
      );
      return false;
    }
    if (typeof point.lat !== "number" || typeof point.lon !== "number") {
      console.warn(
        `[WARN] Invalid truck data format: expected a number for id ${point.id}`,
      );
      return false;
    }
    if (typeof point.timestamp !== "string") {
      console.warn(
        `[WARN] Invalid truck data format: expected a string for timestamp for id ${point.id}`,
      );
      return false;
    }
    return true;
  });

  // Get the bounding box for the polygon
  const maxlat = Math.max(...polygonData.map((p) => p.lat));
  const minlat = Math.min(...polygonData.map((p) => p.lat));
  const maxlong = Math.max(...polygonData.map((p) => p.lon));
  const minlong = Math.min(...polygonData.map((p) => p.lon));

  const isPointInsideBoundingBox = (point: TruckData): boolean => {
    return (
      point.lat >= minlat &&
      point.lat <= maxlat &&
      point.lon >= minlong &&
      point.lon <= maxlong
    );
  };

  const pointsInsideBoundingBox = validTruckData.filter(
    isPointInsideBoundingBox,
  );
  const pointsInsidePolygon: PointsInsidePolygon = {
    outside: [],
    inside: [],
  };

  // Ray casting algorithm to check if a point is inside a polygon
  const isPointInsidePolygon = (point: TruckData): boolean => {
    let inside = false;
    for (
      let i = 0, j = polygonData.length - 1;
      i < polygonData.length;
      j = i++
    ) {
      const xi = polygonData[i].lon,
        yi = polygonData[i].lat;
      const xj = polygonData[j].lon,
        yj = polygonData[j].lat;

      const py = point.lat;
      const px = point.lon;

      const intersect =
        yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check which points are inside the polygon and which are only in the bounding box
  pointsInsideBoundingBox.forEach((point) => {
    if (isPointInsidePolygon(point)) {
      pointsInsidePolygon.inside.push(point);
    } else {
      pointsInsidePolygon.outside.push(point);
    }
  });

  return pointsInsidePolygon;
};

export default zfeEngine;
