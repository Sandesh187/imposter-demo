import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const topicsPath = path.resolve(__dirname, "../data/topics.json");

let allTopics = [];
try {
  const data = fs.readFileSync(topicsPath, "utf-8");
  allTopics = JSON.parse(data);
} catch (error) {
  console.error("Failed to load topics.json", error);
}

// Group by category for backward compatibility and easy lookup
export const topics = {};
allTopics.forEach((item) => {
  if (!topics[item.category]) topics[item.category] = [];
  topics[item.category].push(item.topic); // Keeping just strings for now to not break existing logic
});

export const categories = Object.keys(topics);

// Future use: full objects if we need difficulty
export const topicsDetailed = allTopics;
