import zfeEngine from "./engines/zfe/zfeEngine.ts";

// Mock data import
import rawTruckData from "./data/truck_gps.json" with { type: "json" };
import rawPolygonData from "./data/lyon_polygon.json" with { type: "json" };

import type { TruckData } from "./types/ZfeEngineType.ts";

// Cast the raw data to the correct types
const truckData: TruckData[] = rawTruckData as TruckData[];

// Run the ZFE engine
const zfeResult = zfeEngine(truckData, rawPolygonData);

// Log alerts
zfeResult.inside.forEach((point) => {
  console.log(
    `[ALERT ZFE] ${point.timestamp}: dans la zone ZFE (lat: ${point.lat}, lon: ${point.lon})`,
  );
});
