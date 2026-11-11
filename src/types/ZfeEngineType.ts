export type TruckData = {
  id: number;
  timestamp: string;
  lat: number;
  lon: number;
  expected?: string;
};
export interface TruckWithDistance extends TruckData {
  distanceToBorderKm: number;
}
export type PointsInsidePolygon = {
  // Inside the bounding box but outside the polygon (rejected by ray casting)
  outside: TruckData[];
  inside: TruckData[];
};

export type GeoPoint = {
  lat: number;
  lon: number;
};
