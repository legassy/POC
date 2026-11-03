export type TruckData = {
  id: number;
  timestamp: string;
  lat: number;
  lon: number;
  expected: string;
};

export type PointsInsidePolygon = {
  inBorder: TruckData[];
  inside: TruckData[];
};

export type GeoPoint = {
  lat: number;
  lon: number;
};
