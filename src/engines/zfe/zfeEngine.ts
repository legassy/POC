import type {
  GeoPoint,
  PointsInsidePolygon,
  TruckData,
} from "../../types/ZfeEngineType.ts";

import rawPolygonData from "../../data/lyon_polygon.json" with { type: "json" };

// Cast the raw data to the correct types
const polygonData: GeoPoint[] = rawPolygonData as GeoPoint[];
// Get the bounding box for the polygon
const maxlat = Math.max(...polygonData.map((p) => p.lat));
const minlat = Math.min(...polygonData.map((p) => p.lat));
const maxlong = Math.max(...polygonData.map((p) => p.lon));
const minlong = Math.min(...polygonData.map((p) => p.lon));

/**
 * ZFE Engine that checks which truck data points are inside a given polygon.
 * @param props
 * @returns   Points inside the polygon and on the border of the polygon.
 */
const zfeEngine = (truckData: TruckData[]): PointsInsidePolygon => {
  // Guard to ensure the data is provided
  if (!truckData) {
    throw new Error("Polygon data and truck data must be provided.");
  }

  const isPointInsideBoundingBox = (point: TruckData): boolean => {
    return (
      point.lat >= minlat &&
      point.lat <= maxlat &&
      point.lon >= minlong &&
      point.lon <= maxlong
    );
  };

  const pointsInsideBoundingBox = truckData.filter(isPointInsideBoundingBox);
  const pointsInsidePolygon: PointsInsidePolygon = {
    inBorder: [],
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

  // Check which points are inside the polygon and which are on the border
  pointsInsideBoundingBox.forEach((point) => {
    if (isPointInsidePolygon(point)) {
      pointsInsidePolygon.inside.push(point);
    } else {
      pointsInsidePolygon.inBorder.push(point);
    }
  });

  return pointsInsidePolygon;
};

export default zfeEngine;
