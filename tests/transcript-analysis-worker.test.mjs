import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const worker = fileURLToPath(new URL("../scripts/transcript-analysis-worker.mjs", import.meta.url));

function runWorker(cwd, args) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.NEXT_PUBLIC_CONVEX_URL;
    const child = spawn(process.execPath, [worker, ...args], { cwd, env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("the documented worker command loads .env.local before selecting storage", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "transcript-worker-env-"));
  try {
    await writeFile(path.join(dir, ".env.local"), "NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud\n", "utf8");
    const result = await runWorker(dir, ["--check-storage"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { storage: "convex" });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
