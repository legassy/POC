import rawPolygonData from "../../data/lyon_polygon.json" with { type: "json" };
import type { GeoPoint } from "../../types/GeoPoint.ts";
import rawTruckData from "../../data/truck_gps.json" with { type: "json" };
import type { TruckData } from "../../types/TruckData.ts";

const zfeEngine = () => {
  // Cast the raw data to the appropriate types
  const polygonData = rawPolygonData as unknown as GeoPoint[];
  const truckData = rawTruckData as unknown as TruckData[];

  // Calculate the bounding box for the polygon
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

  const pointsInsideBoundingBox = truckData.filter(isPointInsideBoundingBox);
  const pointsInsidePolygon: { inBorder: TruckData[]; inside: TruckData[] } = {
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
      const xi = polygonData[i].lat,
        yi = polygonData[i].lon;
      const xj = polygonData[j].lat,
        yj = polygonData[j].lon;

      const intersect =
        yi > point.lon !== yj > point.lon &&
        point.lat < ((xj - xi) * (point.lon - yi)) / (yj - yi) + xi;
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

  return `ZFE Engine is running!`;
};

export default zfeEngine;
