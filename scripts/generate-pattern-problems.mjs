import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { convertNeenzaDataset } from "./lib/neenza-converter.mjs";

const DEFAULT_INPUT = "merged_problems.json";
const OUTPUT = new URL(
  "../src/entities/problem/model/generatedPatternProblems.ts",
  import.meta.url,
);

function renderTs(problems) {
  return `import type { Problem } from "./types";\n\n// Generated from merged_problems.json. Do not edit manually.\nexport const generatedPatternProblems: Problem[] = ${JSON.stringify(problems, null, 2)};\n`;
}

const sourcePath = resolve(process.cwd(), process.argv[2] ?? DEFAULT_INPUT);
const dataset = JSON.parse(await readFile(sourcePath, "utf-8"));
const { problems, skippedCount } = convertNeenzaDataset(dataset);

await writeFile(OUTPUT, renderTs(problems));

console.log(`Generated ${problems.length} problems into ${fileURLToPath(OUTPUT)}`);

if (skippedCount > 0) {
  console.log(`Skipped ${skippedCount} invalid items`);
}
