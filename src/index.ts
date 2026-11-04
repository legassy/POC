import zfeEngine from "./engines/zfe/zfeEngine.ts";

import type { GeoPoint, TruckData } from "./types/ZfeEngineType.ts";
import readJson from "./utils/readJson.ts";

// Cast the raw data to the correct types
const truckData: TruckData[] = readJson(
  "src/data/truck_gps.json",
) as TruckData[];

const polygonData: GeoPoint[] = readJson(
  "src/data/lyon_polygon.json",
) as GeoPoint[];

// Run the ZFE engine
try {
  const zfeResult = zfeEngine(truckData, polygonData);

  // Log alerts
  zfeResult.inside.forEach((point) => {
    console.log(
      `[ALERT ZFE] ${point.timestamp}: dans la zone ZFE (lat: ${point.lat}, lon: ${point.lon})`,
    );
  });
} catch (error) {
  console.error(
    `[ERROR] Failed to run ZFE engine: ${(error as Error).message}`,
  );
}
