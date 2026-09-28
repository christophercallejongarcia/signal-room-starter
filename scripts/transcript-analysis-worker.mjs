import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const [{ getStorage, storageKind }, { processTranscriptAnalyses }] = await Promise.all([
  import("../lib/adapters/storage/index.ts"),
  import("../lib/transcript-analysis-run.ts"),
]);

const storage = storageKind();
if (process.argv.includes("--check-storage")) {
  console.log(JSON.stringify({ storage }));
  process.exit(0);
}

const numericArgument = process.argv.slice(2).find((value) => /^\d+$/.test(value));
const requested = Number.parseInt(numericArgument || "3", 10);
const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 20) : 3;
const result = await processTranscriptAnalyses({ storage: getStorage(), limit });
console.log(JSON.stringify({ storage, ...result }));
