import zfeEngine from "./engines/zfe/zfeEngine.ts";
import safetyEngine from "./engines/safety/safetyEngine.ts";

import type { GeoPoint, TruckData } from "./types/ZfeEngineType.ts";
import readJson from "./utils/readJson.ts";

// Cast the raw data to the correct types
const truckData: TruckData[] = readJson(
  "src/data/zfe/truck_gps.json",
) as TruckData[];

const polygonData: GeoPoint[] = readJson(
  "src/data/zfe/lyon_polygon.json",
) as GeoPoint[];

// Run the ZFE engine
if (process.argv[2] === "zfe") {
  try {
    const zfeResult = zfeEngine(truckData, polygonData);
    console.info("\n ============ ZFE ENGINE ============ \n");
    console.info(`[INFO] Running ZFE Engine\n`);

    // Log alerts
    zfeResult.inside.forEach((point) => {
      console.log(
        `[ALERT ZFE] ${point.timestamp}: dans la zone ZFE (lat: ${point.lat}, lon: ${point.lon})`,
      );
    });

    console.log(`\n[INFO] ZFE engine completed`);
  } catch (error) {
    console.error(
      `[ERROR] Failed to run ZFE engine: ${(error as Error).message}`,
    );
  }
  console.info("\n ==================================== \n ");
}

// Run the Safety engine
else if (process.argv[2] === "safety") {
  console.info("\n ============ SAFETY ENGINE ============ \n");
  console.info(`[INFO] Running Safety Engine\n`);

  await safetyEngine();
  console.info(`\n[INFO] Safety engine completed`);
  console.info("\n ==================================== \n ");
} else {
  console.error(
    `[ERROR] Invalid argument. Please provide either "zfe" or "safety" as an argument.`,
  );
}
