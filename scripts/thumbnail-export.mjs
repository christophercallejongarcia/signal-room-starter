// Copies one Thumbnail-Builder run into a folder outside the repo:
//   node scripts/thumbnail-export.mjs <runId|latest> <absolute target folder>
// Writes variante-1..3 (the approved text layer, or the finished image of an
// older run) and verweise.md with the Outliers behind each variant and the
// variant Chris chose.
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
if (result.files.length === 0) console.error("No finished variant yet: approve a text layer first.");
console.log([...result.files, result.note].join("\n"));
