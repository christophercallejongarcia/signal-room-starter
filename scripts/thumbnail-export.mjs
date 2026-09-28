// Copies one Thumbnail-Builder run into a folder outside the repo:
//   node scripts/thumbnail-export.mjs <runId|latest> <absolute target folder>
// Writes variante-1..3 and verweise.md with the Outliers behind each variant.
const [{ exportRun, listRuns }] = await Promise.all([import("../lib/adapters/storage/thumbnail-store.ts")]);

const [requested, target] = process.argv.slice(2);
if (!requested || !target) {
  console.error("Usage: node scripts/thumbnail-export.mjs <runId|latest> <absolute target folder>");
  process.exit(1);
}
const runId = requested === "latest" ? (await listRuns())[0]?.id : requested;
if (!runId) {
  console.error("No thumbnail run found.");
  process.exit(1);
}
const result = await exportRun(runId, target);
console.log([...result.files, result.note].join("\n"));
