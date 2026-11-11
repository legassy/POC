import fs from "fs";
import csv from "csv-parser";
import { pipeline } from "stream";
import dayjs from "dayjs";

import type { SafetyData } from "../../types/SafetyType.ts";

/**
 * Safety Engine
 * Filters the accelerometer data to find harsh braking events and calculates a daily score based on the number of events.
 *
 * @param link data location
 * @param threshold threshold of harsh braking
 *
 * @returns a JSON file with the daily score and the harsh braking events
 */
const safetyEngine = async (link: string, threshold: number = -2.5) => {
  const results: SafetyData[] = [];
  let rowCounter: number = 0;

  // Read the CSV file and parse it
  await new Promise((resolve, reject) => {
    console.info("[INFO] Reading accelerometer_data.csv file...\n");
    pipeline(fs.createReadStream(link), csv(), (err: Error | null) => {
      if (err) {
        console.error("Error reading CSV file:", err);
        reject(err);
      } else {
        if (rowCounter === 0) {
          reject(new Error("[Error] Empty file"));
        }

        resolve(undefined);
      }
    }).on("data", (data: SafetyData) => {
      // Check incomplete row data
      if (!data.timestamp || !data.acc_x || !data.acc_y || !data.acc_z) {
        console.warn("[WARN] Missing data in CSV row:", data);
        return;
      }

      // Check not number value
      if (
        Number.isNaN(Number(data.acc_x)) ||
        Number.isNaN(Number(data.acc_y)) ||
        Number.isNaN(Number(data.acc_z))
      ) {
        console.warn(`[WARN] ${data.timestamp} have incorect value`);
        return;
      }

      // Increment row counter
      rowCounter = rowCounter + 1;

      // Convert string values to numbers
      const parsedData: SafetyData = {
        timestamp: Number(data.timestamp),
        acc_x: Number(data.acc_x),
        acc_y: Number(data.acc_y),
        acc_z: Number(data.acc_z),
      };

      if (parsedData.acc_y < threshold) {
        results.push(parsedData);
      }
    });
  });

  const dataDate = dayjs.unix(results[0]?.timestamp).format("YYYY-MM-DD");

  const dailyScore = {
    date: dataDate,
    count: results.length,
    unit: "m/s²",
    threshold: threshold,
    events: results,

    // 100 - (harsh braking events * 5) with a minimum score of 0
    score: 100 - results.length * 5 < 0 ? 0 : 100 - results.length * 5,
  };

  // Log the results
  results.forEach((data) => {
    console.log(
      `[ALERT SAFETY] ${dayjs.unix(data.timestamp).format("YYYY-MM-DD HH:mm")}: Harsh braking detected (acc_y: ${data.acc_y})`,
    );
  });

  // Create dossier
  fs.mkdirSync("output", {
    recursive: true,
  });

  // Create a new JSON file with the filtered results
  fs.writeFileSync(
    "src/data/safety/output/daily_score.json",
    JSON.stringify(dailyScore, null, 2),
  );

  console.info(
    `\n[INFO] Daily score saved to src/data/safety/output/daily_score.json`,
  );
  return dailyScore;
};

export default safetyEngine;
