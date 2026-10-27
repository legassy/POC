import rawPolygonData from "../../data/lyon_polygon.json" with { type: "json" };
import type { GeoPoint } from "../../types/GeoPoint.ts";

const zfeEngine = () => {
  // Type the JSON data
  const polygonData = rawPolygonData as unknown as GeoPoint[];

  return `ZFE Engine is running! Polygon data: ${JSON.stringify(polygonData)}`;
};

export default zfeEngine;
