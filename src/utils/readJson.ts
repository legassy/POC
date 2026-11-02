import { readFileSync } from "node:fs";

function readJson(path: string): unknown | null {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`[ERROR] Cannot load ${path}: ${(err as Error).message}`);
    return null;
  }
}

export default readJson;
