import fs from "fs";
import csv from "csv-parser";
import { pipeline } from "stream";
import dayjs from "dayjs";

import type { SafetyData } from "../../types/SafetyType.ts";

const safetyEngine = async () => {
  const results: SafetyData[] = [];

  // Read the CSV file and parse it
  await new Promise((resolve, reject) => {
    console.info("[INFO] Reading accelerometer_data.csv file...");
    pipeline(
      fs.createReadStream("src/data/safety/accelerometer_data.csv"),
      csv(),
      (err: Error | null) => {
        if (err) {
          console.error("Error reading CSV file:", err);
          reject(err);
        } else {
          console.log("\n CSV file successfully processed. \n");
          resolve(undefined);
        }
      },
    ).on("data", (data: SafetyData) => {
      if (!data.timestamp || !data.acc_x || !data.acc_y || !data.acc_z) {
        console.warn("[WARN] Missing data in CSV row:", data);
        return;
      }
      // Convert string values to numbers
      const parsedData: SafetyData = {
        timestamp: Number(data.timestamp),
        acc_x: Number(data.acc_x),
        acc_y: Number(data.acc_y),
        acc_z: Number(data.acc_z),
      };

      if (parsedData.acc_y < -2.5) {
        results.push(parsedData);
      }
    });
  });

  const dailyScore = {
    count: results.length,
    events: results,
  };

  // Log the filtered results
  console.info(
    `[INFO] Found ${results.length} instances of harsh braking (acc_y < -2.5) \n`,
  );
  results.forEach((data) => {
    console.log(
      `[ALERT SAFETY] ${dayjs.unix(data.timestamp).format("YYYY-MM-DD HH:mm")}: Harsh braking detected (acc_y: ${data.acc_y})`,
    );
  });

  // Creat a new JSON file with the filtered results
  fs.writeFileSync(
    "src/data/safety/daily_score.json",
    JSON.stringify(dailyScore, null, 2),
  );
  console.info(`[INFO] Daily score saved to src/data/safety/daily_score.json`);
};

export default safetyEngine;
